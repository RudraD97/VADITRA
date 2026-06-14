package com.vaditra.app;

import android.app.Activity;
import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;
import android.os.Build;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MediaSessionPlugin")
public class MediaSessionPlugin extends Plugin {

    private static MediaSession.Token sessionToken = null;
    private MediaSession mediaSession;
    private AudioManager audioManager;
    private AudioFocusRequest audioFocusRequest;
    private final AudioManager.OnAudioFocusChangeListener afChangeListener =
        focusChange -> {
            JSObject ret = new JSObject();
            ret.put("focusChange", focusChange);
            notifyListeners("audioFocusChange", ret);
        };

    public static MediaSession.Token getSessionToken() {
        return sessionToken;
    }

    @Override
    public void load() {
        super.load();
        Activity activity = getActivity();
        if (activity == null) return;

        audioManager = (AudioManager) activity.getSystemService(Context.AUDIO_SERVICE);

        mediaSession = new MediaSession(activity, "VADITRA");
        mediaSession.setCallback(new MediaSession.Callback() {
            @Override
            public void onPlay() {
                notifyListeners("play", new JSObject());
            }

            @Override
            public void onPause() {
                notifyListeners("pause", new JSObject());
            }

            @Override
            public void onSkipToNext() {
                notifyListeners("next", new JSObject());
            }

            @Override
            public void onSkipToPrevious() {
                notifyListeners("previous", new JSObject());
            }

            @Override
            public void onSeekTo(long pos) {
                JSObject ret = new JSObject();
                ret.put("position", (double) pos / 1000.0);
                notifyListeners("seekTo", ret);
            }
        });
        mediaSession.setFlags(MediaSession.FLAG_HANDLES_MEDIA_BUTTONS | MediaSession.FLAG_HANDLES_TRANSPORT_CONTROLS);
        mediaSession.setActive(true);
        sessionToken = mediaSession.getSessionToken();
    }

    @PluginMethod
    public void requestAudioFocus(PluginCall call) {
        if (audioManager == null) {
            call.resolve();
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();
            audioFocusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN)
                .setAudioAttributes(attrs)
                .setOnAudioFocusChangeListener(afChangeListener)
                .build();
            audioManager.requestAudioFocus(audioFocusRequest);
        } else {
            audioManager.requestAudioFocus(afChangeListener,
                AudioManager.STREAM_MUSIC,
                AudioManager.AUDIOFOCUS_GAIN);
        }
        call.resolve();
    }

    @PluginMethod
    public void abandonAudioFocus(PluginCall call) {
        if (audioManager == null) {
            call.resolve();
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
            audioManager.abandonAudioFocusRequest(audioFocusRequest);
            audioFocusRequest = null;
        } else {
            audioManager.abandonAudioFocus(afChangeListener);
        }
        call.resolve();
    }

    @PluginMethod
    public void setActive(PluginCall call) {
        boolean active = call.getBoolean("active", true);
        if (mediaSession != null) {
            mediaSession.setActive(active);
            if (active) {
                sessionToken = mediaSession.getSessionToken();
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void setPlaying(PluginCall call) {
        boolean playing = call.getBoolean("playing", false);
        if (mediaSession != null) {
            PlaybackState state = new PlaybackState.Builder()
                    .setState(playing ? PlaybackState.STATE_PLAYING : PlaybackState.STATE_PAUSED,
                            0, 1.0f)
                    .setActions(PlaybackState.ACTION_PLAY |
                            PlaybackState.ACTION_PAUSE |
                            PlaybackState.ACTION_SKIP_TO_NEXT |
                            PlaybackState.ACTION_SKIP_TO_PREVIOUS |
                            PlaybackState.ACTION_SEEK_TO |
                            PlaybackState.ACTION_STOP)
                    .build();
            mediaSession.setPlaybackState(state);
        }
        call.resolve();
    }

    @PluginMethod
    public void setMetadata(PluginCall call) {
        if (mediaSession == null) {
            call.reject("MediaSession not initialized");
            return;
        }
        String title = call.getString("title", "");
        String artist = call.getString("artist", "");
        String album = call.getString("album", "");
        String artworkUrl = call.getString("artwork", "");

        // Set metadata immediately without artwork so title/artist show right away
        MediaMetadata.Builder builder = new MediaMetadata.Builder();
        builder.putString(MediaMetadata.METADATA_KEY_TITLE, title);
        builder.putString(MediaMetadata.METADATA_KEY_ARTIST, artist);
        builder.putString(MediaMetadata.METADATA_KEY_ALBUM, album);
        mediaSession.setMetadata(builder.build());
        call.resolve();

        // Load artwork asynchronously and update metadata once loaded
        if (artworkUrl != null && !artworkUrl.isEmpty()) {
            final String finalTitle = title;
            final String finalArtist = artist;
            final String finalAlbum = album;
            new Thread(() -> {
                try {
                    java.net.URL url = new java.net.URL(artworkUrl);
                    android.graphics.Bitmap bitmap = android.graphics.BitmapFactory.decodeStream(url.openStream());
                    if (bitmap != null && mediaSession != null) {
                        MediaMetadata withArt = new MediaMetadata.Builder()
                            .putString(MediaMetadata.METADATA_KEY_TITLE, finalTitle)
                            .putString(MediaMetadata.METADATA_KEY_ARTIST, finalArtist)
                            .putString(MediaMetadata.METADATA_KEY_ALBUM, finalAlbum)
                            .putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, bitmap)
                            .build();
                        mediaSession.setMetadata(withArt);
                    }
                } catch (Exception e) {
                    android.util.Log.w("MediaSessionPlugin", "Artwork load failed: " + e.getMessage());
                }
            }).start();
        }
    }

    @PluginMethod
    public void release(PluginCall call) {
        if (audioManager != null) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && audioFocusRequest != null) {
                audioManager.abandonAudioFocusRequest(audioFocusRequest);
                audioFocusRequest = null;
            } else {
                audioManager.abandonAudioFocus(afChangeListener);
            }
        }
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
            mediaSession = null;
            sessionToken = null;
        }
        call.resolve();
    }
}
