import { useEffect, useRef, useCallback } from 'react'
import usePlayerStore from '../store/playerStore'
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service'
import MediaSessionNative from '../src/plugins/media-session'

const BTN_PLAY_PAUSE = 10
const BTN_PREV = 20
const BTN_NEXT = 30

function log(...args) { console.log('[BackgroundPlayback]', ...args) }
function warn(...args) { console.warn('[BackgroundPlayback]', ...args) }

function getButtons(playing) {
  return [
    { title: 'Previous', id: BTN_PREV },
    { title: playing ? 'Pause' : 'Play', id: BTN_PLAY_PAUSE },
    { title: 'Next', id: BTN_NEXT },
  ]
}

function getServiceOptions(track, playing) {
  return {
    id: 1,
    notificationChannelId: 'vaditra-playback',
    title: track?.title || 'VADITRA',
    body: track ? `${track.artist || 'Unknown Artist'} • ${track.album || 'VADITRA'}` : 'No track selected',
    smallIcon: 'ic_notification',
    silent: true,
    buttons: getButtons(playing),
    serviceType: 32,
  }
}

export function useBackgroundPlayback(audioRef) {
  const prevTrackIdRef = useRef(null)
  const serviceStartedRef = useRef(false)
  const keepAliveRef = useRef(null)

  const openPlayer = useCallback(() => {
    usePlayerStore.getState().setPlayerExpanded(true)
  }, [])

  useEffect(() => {
    ForegroundService.createNotificationChannel({
      id: 'vaditra-playback',
      name: 'Music Playback',
      importance: 2,
      description: 'Now playing notification',
    }).then(() => log('Notification channel created'))
      .catch((e) => warn('Create channel failed:', e))

    MediaSessionNative.setActive({ active: true })
      .then(() => log('Native MediaSession activated'))
      .catch((e) => warn('Native MediaSession activate failed:', e))
  }, [])

  useEffect(() => {
    try {
      if (navigator.mediaSession) {
        navigator.mediaSession.setActionHandler('play', () => {
          usePlayerStore.getState().play()
        })
        navigator.mediaSession.setActionHandler('pause', () => {
          usePlayerStore.getState().pause()
        })
        navigator.mediaSession.setActionHandler('previoustrack', () => {
          usePlayerStore.getState().playPrevious()
        })
        navigator.mediaSession.setActionHandler('nexttrack', () => {
          usePlayerStore.getState().playNext()
        })
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime != null) {
            usePlayerStore.setState({ currentTime: details.seekTime })
            if (audioRef?.current) {
              audioRef.current.currentTime = details.seekTime
            }
          }
        })
      }
    } catch (e) {
      warn('MediaSession not supported:', e)
    }

    ForegroundService.addListener('buttonClicked', ({ buttonId }) => {
      log('Notification button clicked:', buttonId)
      switch (buttonId) {
        case BTN_PLAY_PAUSE:
          usePlayerStore.getState().togglePlay()
          break
        case BTN_PREV:
          usePlayerStore.getState().playPrevious()
          break
        case BTN_NEXT:
          usePlayerStore.getState().playNext()
          break
      }
    }).catch((e) => warn('Add buttonClicked listener failed:', e))

    ForegroundService.addListener('notificationTapped', () => {
      log('Notification tapped')
      openPlayer()
    }).catch((e) => warn('Add notificationTapped listener failed:', e))

    MediaSessionNative.addListener('play', () => {
      log('Native AVRCP: play')
      usePlayerStore.getState().play()
    }).catch((e) => warn('Native MediaSession play listener failed:', e))

    MediaSessionNative.addListener('pause', () => {
      log('Native AVRCP: pause')
      usePlayerStore.getState().pause()
    }).catch((e) => warn('Native MediaSession pause listener failed:', e))

    MediaSessionNative.addListener('next', () => {
      log('Native AVRCP: next')
      usePlayerStore.getState().playNext()
    }).catch((e) => warn('Native MediaSession next listener failed:', e))

    MediaSessionNative.addListener('previous', () => {
      log('Native AVRCP: previous')
      usePlayerStore.getState().playPrevious()
    }).catch((e) => warn('Native MediaSession previous listener failed:', e))

    MediaSessionNative.addListener('seekTo', ({ position }) => {
      log('Native AVRCP: seekTo', position)
      if (position != null) {
        usePlayerStore.setState({ currentTime: position })
        if (audioRef?.current) {
          audioRef.current.currentTime = position
        }
      }
    }).catch((e) => warn('Native MediaSession seekTo listener failed:', e))

    return () => {
      ForegroundService.removeAllListeners().catch((e) => warn('Remove listeners failed:', e))
      MediaSessionNative.removeAllListeners().catch((e) => warn('Native MediaSession remove listeners failed:', e))
      MediaSessionNative.release().catch((e) => warn('Native MediaSession release failed:', e))
    }
  }, [audioRef, openPlayer])

  useEffect(() => {
    const unsub = usePlayerStore.subscribe(
      (s) => ({ track: s.currentTrack, playing: s.isPlaying }),
      ({ track, playing }) => {
        const prevTrackId = prevTrackIdRef.current
        const trackId = track?.id

        try {
          if (navigator.mediaSession) {
            if (track && trackId !== prevTrackId) {
              const artwork = track.cover
                ? [
                    { src: track.cover, sizes: '512x512', type: 'image/jpeg' },
                    { src: track.cover, sizes: '1024x1024', type: 'image/jpeg' },
                  ]
                : []
              navigator.mediaSession.metadata = new MediaMetadata({
                title: track.title || '',
                artist: track.artist || '',
                album: track.album || '',
                artwork,
              })
            }
            navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
          }
        } catch (e) {
          warn('MediaSession update failed:', e)
        }

        // Keep-alive for online streaming tracks — prevents network sleep
        if (keepAliveRef.current) {
          clearInterval(keepAliveRef.current)
          keepAliveRef.current = null
        }
        if (track && playing && track._source === 'online' && track.src) {
          keepAliveRef.current = setInterval(() => {
            fetch(track.src, { method: 'HEAD', mode: 'cors' }).catch(() => {})
          }, 30000)
        }

        if (track && trackId !== prevTrackId) {
          MediaSessionNative.setMetadata({
            title: track.title || '',
            artist: track.artist || '',
            album: track.album || '',
            artwork: track.cover || '',
          }).catch((e) => warn('Native MetaData update failed:', e))
        }
        MediaSessionNative.setPlaying({ playing })
          .catch((e) => warn('Native setPlaying failed:', e))

        if (track) {
          if (!serviceStartedRef.current) {
            serviceStartedRef.current = true
            log('Starting foreground service')
            ForegroundService.requestPermissions()
              .then((r) => {
                log('Permission result:', JSON.stringify(r))
                return ForegroundService.startForegroundService(getServiceOptions(track, playing))
              })
              .then(() => log('Foreground service started'))
              .catch((e) => warn('ForegroundService start:', e))
          } else {
            ForegroundService.updateForegroundService(getServiceOptions(track, playing))
              .catch((e) => warn('ForegroundService update:', e))
          }
        } else if (!track && serviceStartedRef.current) {
          serviceStartedRef.current = false
          log('Stopping foreground service')
          ForegroundService.stopForegroundService()
            .then(() => log('Foreground service stopped'))
            .catch((e) => warn('ForegroundService stop:', e))
        }

        prevTrackIdRef.current = trackId
      }
    )
    return unsub
  }, [])

  // Update MediaSession position state as playback progresses
  useEffect(() => {
    const unsub = usePlayerStore.subscribe(
      (s) => ({ time: s.currentTime, duration: s.duration, playing: s.isPlaying }),
      ({ time, duration, playing }) => {
        if (!playing || !duration) return
        try {
          if (navigator.mediaSession && typeof navigator.mediaSession.setPositionState === 'function') {
            navigator.mediaSession.setPositionState({
              duration,
              playbackRate: 1,
              position: time,
            })
          }
        } catch {}
      }
    )
    return unsub
  }, [])

  useEffect(() => {
    return () => {
      if (keepAliveRef.current) {
        clearInterval(keepAliveRef.current)
        keepAliveRef.current = null
      }
      if (serviceStartedRef.current) {
        ForegroundService.stopForegroundService().catch((e) => warn('ForegroundService stop on unmount:', e))
        serviceStartedRef.current = false
      }
      MediaSessionNative.setActive({ active: false }).catch(() => {})
    }
  }, [])
}
