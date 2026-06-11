package com.vaditra.app;

import android.app.Activity;
import android.media.MediaMetadata;
import android.media.session.MediaSession;
import android.media.session.PlaybackState;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "MediaSessionPlugin")
public class MediaSessionPlugin extends Plugin {

    private static MediaSession.Token sessionToken = null;
    private MediaSession mediaSession;

    public static MediaSession.Token getSessionToken() {
        return sessionToken;
    }

    @Override
    public void load() {
        super.load();
        Activity activity = getActivity();
        if (activity == null) return;
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

        MediaMetadata.Builder builder = new MediaMetadata.Builder();
        builder.putString(MediaMetadata.METADATA_KEY_TITLE, title);
        builder.putString(MediaMetadata.METADATA_KEY_ARTIST, artist);
        builder.putString(MediaMetadata.METADATA_KEY_ALBUM, album);

        mediaSession.setMetadata(builder.build());
        call.resolve();
    }

    @PluginMethod
    public void release(PluginCall call) {
        if (mediaSession != null) {
            mediaSession.setActive(false);
            mediaSession.release();
            mediaSession = null;
            sessionToken = null;
        }
        call.resolve();
    }
}
