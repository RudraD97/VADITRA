import { useEffect, useRef } from 'react'
import usePlayerStore from '../store/playerStore'
import { ForegroundService } from '@capawesome-team/capacitor-android-foreground-service'

const MEDIA_PLAYBACK_TYPE = 1
const BTN_PLAY_PAUSE = 10
const BTN_PREV = 20
const BTN_NEXT = 30

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
    title: track?.title || 'VADITRA',
    body: track ? `${track.artist || 'Unknown Artist'} • ${track.album || 'VADITRA'}` : 'No track selected',
    smallIcon: 'ic_notification',
    serviceType: MEDIA_PLAYBACK_TYPE,
    silent: true,
    buttons: getButtons(playing),
  }
}

export function useBackgroundPlayback(audioRef) {
  const prevTrackIdRef = useRef(null)
  const serviceStartedRef = useRef(false)
  const permissionRequestedRef = useRef(false)

  useEffect(() => {
    if ('mediaSession' in navigator) {
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

    ForegroundService.addListener('buttonClicked', ({ buttonId }) => {
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
    }).catch(() => {})

    return () => {
      ForegroundService.removeAllListeners().catch(() => {})
    }
  }, [audioRef])

  useEffect(() => {
    const unsub = usePlayerStore.subscribe(
      (s) => ({ track: s.currentTrack, playing: s.isPlaying }),
      ({ track, playing }) => {
        const prevTrackId = prevTrackIdRef.current
        const trackId = track?.id

        if ('mediaSession' in navigator) {
          if (track && trackId !== prevTrackId) {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: track.title || '',
              artist: track.artist || '',
              album: track.album || '',
              artwork: track.cover
                ? [{ src: track.cover, sizes: '512x512', type: 'image/jpeg' }]
                : [],
            })
          }
          navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'
        }

        if (track) {
          if (!serviceStartedRef.current) {
            if (!permissionRequestedRef.current) {
              permissionRequestedRef.current = true
              ForegroundService.requestPermissions().catch(() => {})
            }
            ForegroundService.startForegroundService(getServiceOptions(track, playing)).catch(() => {})
            serviceStartedRef.current = true
          } else {
            ForegroundService.updateForegroundService(getServiceOptions(track, playing)).catch(() => {})
          }
        } else if (!track && serviceStartedRef.current) {
          ForegroundService.stopForegroundService().catch(() => {})
          serviceStartedRef.current = false
        }

        prevTrackIdRef.current = trackId
      }
    )
    return unsub
  }, [])

  useEffect(() => {
    return () => {
      if (serviceStartedRef.current) {
        ForegroundService.stopForegroundService().catch(() => {})
        serviceStartedRef.current = false
      }
    }
  }, [])
}
