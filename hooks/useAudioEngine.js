import { useEffect, useRef, useCallback } from 'react'
import usePlayerStore from '../store/playerStore'
import { setAudioElement } from '../utils/audioElement'
import { getAudioFile } from '../utils/indexedDB'
import { cacheOnlineTrackLocally, clearPartialDownload, hasPartialDownload } from '../utils/streamBuffer'
import MediaSessionNative from '../src/plugins/media-session'
import useOnlineStatus from './useOnlineStatus'

const AUDIOFOCUS_GAIN = 1
const AUDIOFOCUS_LOSS = -1
const AUDIOFOCUS_LOSS_TRANSIENT = -2
const AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK = -3

export function useAudioEngine() {
  const audioRef = useRef(null)
  const hasCanPlayRef = useRef(false)
  const wakeLockRef = useRef(null)
  const wasPlayingBeforeInterruptRef = useRef(false)
  const cacheRetryTimerRef = useRef(null)

  const currentTrack = usePlayerStore(s => s.currentTrack)
  const isPlaying = usePlayerStore(s => s.isPlaying)
  const volume = usePlayerStore(s => s.volume)
  const isMuted = usePlayerStore(s => s.isMuted)
  const setDuration = usePlayerStore(s => s.setDuration)
  const playNext = usePlayerStore(s => s.playNext)
  const isOnline = useOnlineStatus()

  async function acquireWakeLock() {
    if (wakeLockRef.current) return
    try {
      if ('wakeLock' in navigator) {
        const sentinel = await navigator.wakeLock.request('screen')
        wakeLockRef.current = sentinel
        sentinel.addEventListener('release', () => {
          wakeLockRef.current = null
          if (usePlayerStore.getState().isPlaying) acquireWakeLock()
        })
      }
    } catch { /* wake lock not supported */ }
  }

  function releaseWakeLock() {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {})
      wakeLockRef.current = null
    }
  }

  async function recoverBlobUrl(trackId, audio, savedTime) {
    try {
      const file = await getAudioFile(trackId)
      if (!file) throw new Error('not found')
      const url = URL.createObjectURL(file)
      const state = usePlayerStore.getState()
      state.restoreTrackSrc(trackId, url)
      audio.src = url
      audio.load()
      if (savedTime > 0) audio.currentTime = savedTime
      audio.play().catch(() => {})
      usePlayerStore.setState({ audioError: null })
    } catch {
      usePlayerStore.setState({ isPlaying: false, audioError: 'File expired — please re-upload' })
    }
  }

  async function startCacheOnlineTrack(track) {
    if (!track || track._source !== 'online' || track._isBuffered) return
    const audio = audioRef.current
    if (!audio || !track.src) return
    const trackId = track.id

    cacheOnlineTrackLocally(track, (blobUrl) => {
      const state = usePlayerStore.getState()
      if (state.currentTrack?.id !== trackId) {
        URL.revokeObjectURL(blobUrl)
        return
      }
      const savedTime = audio.currentTime
      const wasPlaying = !audio.paused
      audio.src = blobUrl
      audio.load()
      audio.currentTime = savedTime
      if (wasPlaying) audio.play().catch(() => {})
      state.restoreTrackSrc(trackId, blobUrl)
    })
  }

  // Retry caching when network comes back online
  useEffect(() => {
    if (cacheRetryTimerRef.current) {
      clearTimeout(cacheRetryTimerRef.current)
      cacheRetryTimerRef.current = null
    }
    if (!isOnline) return

    const track = usePlayerStore.getState().currentTrack
    if (!track || track._source !== 'online' || track._isBuffered) return
    if (!hasPartialDownload(track.id)) return

    cacheRetryTimerRef.current = setTimeout(() => {
      startCacheOnlineTrack(usePlayerStore.getState().currentTrack)
    }, 2000)

    return () => {
      if (cacheRetryTimerRef.current) clearTimeout(cacheRetryTimerRef.current)
    }
  }, [isOnline])

  // Cleanup partial downloads when track changes
  useEffect(() => {
    return () => {
      if (currentTrack?.id) clearPartialDownload(currentTrack.id)
    }
  }, [currentTrack?.id])

  // Initialize audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.crossOrigin = 'anonymous'
      audioRef.current.preload = 'auto'
      setAudioElement(audioRef.current)
    }
    const audio = audioRef.current

    const handleTimeUpdate = () => {
      usePlayerStore.setState({ currentTime: audio.currentTime })
    }

    const handleDurationChange = () => {
      if (!isNaN(audio.duration)) setDuration(audio.duration)
    }

    const handleEnded = () => {
      playNext()
    }

    const handleError = () => {
      const err = audio.error
      let msg = 'Unknown error'
      if (err) {
        switch (err.code) {
          case MediaError.MEDIA_ERR_ABORTED: msg = 'Playback aborted'; break
          case MediaError.MEDIA_ERR_NETWORK: msg = 'Network error — file not found?'; break
          case MediaError.MEDIA_ERR_DECODE: msg = 'File cannot be decoded'; break
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED: msg = 'Audio format not supported'; break
          default: msg = err.message || `Error code ${err.code}`
        }
      }

      // Auto-recovery: blob URL likely GC'd by Android WebView
      const { currentTrack, currentTime } = usePlayerStore.getState()
      if (err?.code === MediaError.MEDIA_ERR_NETWORK && currentTrack?.src?.startsWith('blob:')) {
        recoverBlobUrl(currentTrack.id, audio, currentTime)
        return
      }

      usePlayerStore.setState({ isPlaying: false, audioError: msg, currentTime: audio.currentTime })
    }

    const handleCanPlay = () => {
      hasCanPlayRef.current = true
      if (usePlayerStore.getState().isPlaying && audio.paused) {
        audio.play().catch(() => {
          usePlayerStore.setState({ isPlaying: false })
        })
      }
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('durationchange', handleDurationChange)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('error', handleError)
    audio.addEventListener('canplay', handleCanPlay)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('durationchange', handleDurationChange)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('error', handleError)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [])

  // Load new track when currentTrack changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    if (!currentTrack.src) {
      usePlayerStore.setState({
        isPlaying: false,
        audioError: 'File expired — please re-upload the track',
      })
      return
    }

    if (audio.src === currentTrack.src) return

    hasCanPlayRef.current = false
    usePlayerStore.setState({ currentTime: 0, duration: 0, audioError: null })
    audio.src = currentTrack.src
    audio.load()
  }, [currentTrack?.id])

  // Play / pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    if (isPlaying) {
      if (hasCanPlayRef.current || audio.readyState >= 2) {
        audio.play().catch(() => {})
      }
    } else {
      audio.pause()
    }
  }, [isPlaying])

  // Volume
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  // Wake lock
  useEffect(() => {
    if (isPlaying && currentTrack) {
      acquireWakeLock()
    } else {
      releaseWakeLock()
    }
    return () => releaseWakeLock()
  }, [isPlaying, currentTrack?.id])

  // Visibility change — re-acquire wake lock + auto-resume if interrupted
  useEffect(() => {
    const handle = () => {
      if (document.visibilityState === 'visible') {
        const state = usePlayerStore.getState()
        if (state.isPlaying) {
          acquireWakeLock()
          const audio = audioRef.current
          if (audio && audio.paused) {
            audio.play().catch(() => {})
          }
        }
      }
    }
    document.addEventListener('visibilitychange', handle)
    return () => document.removeEventListener('visibilitychange', handle)
  }, [])

  // Audio focus — native Android interruptions (phone calls, navigation)
  useEffect(() => {
    let handle
    MediaSessionNative.addListener('audioFocusChange', ({ focusChange }) => {
      switch (focusChange) {
        case AUDIOFOCUS_GAIN:
          if (wasPlayingBeforeInterruptRef.current) {
            wasPlayingBeforeInterruptRef.current = false
            usePlayerStore.getState().play()
          }
          break
        case AUDIOFOCUS_LOSS:
          wasPlayingBeforeInterruptRef.current = false
          usePlayerStore.getState().pause()
          break
        case AUDIOFOCUS_LOSS_TRANSIENT:
        case AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK:
          wasPlayingBeforeInterruptRef.current = usePlayerStore.getState().isPlaying
          usePlayerStore.getState().pause()
          break
      }
    }).then(h => { handle = h }).catch(() => {})

    return () => {
      if (handle) handle.remove()
      MediaSessionNative.abandonAudioFocus().catch(() => {})
    }
  }, [])

  // Request / abandon audio focus with play state
  useEffect(() => {
    if (isPlaying && currentTrack) {
      MediaSessionNative.requestAudioFocus().catch(() => {})
    } else {
      MediaSessionNative.abandonAudioFocus().catch(() => {})
    }
  }, [isPlaying, currentTrack?.id])

  // Online track caching
  useEffect(() => {
    if (currentTrack) startCacheOnlineTrack(currentTrack)
  }, [currentTrack?.id, currentTrack?._source])

  const seekTo = useCallback((time) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = time
    usePlayerStore.setState({ currentTime: time })
  }, [])

  return { audioRef, seekTo }
}

export default useAudioEngine
