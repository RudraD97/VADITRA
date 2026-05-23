import { useEffect, useRef, useCallback } from 'react'
import usePlayerStore from '../store/playerStore'
import { setAudioElement } from '../utils/audioElement'

export function useAudioEngine() {
  const audioRef = useRef(null)
  const hasCanPlayRef = useRef(false)

  const currentTrack = usePlayerStore(s => s.currentTrack)
  const isPlaying = usePlayerStore(s => s.isPlaying)
  const volume = usePlayerStore(s => s.volume)
  const isMuted = usePlayerStore(s => s.isMuted)
  const setDuration = usePlayerStore(s => s.setDuration)
  const playNext = usePlayerStore(s => s.playNext)

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
      usePlayerStore.setState({ isPlaying: false, audioError: msg })
    }

    const handleCanPlay = () => {
      hasCanPlayRef.current = true
      // Only play if the store says we should be playing AND the
      // audio isn't already playing (playSrc in the action might
      // have already succeeded).
      if (usePlayerStore.getState().isPlaying && audio.paused) {
        audio.play().catch(() => {
          // Still blocked — flip isPlaying so the UI shows a play button
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

    // Already loaded by setQueue's user-gesture handler — don't reload
    if (audio.currentSrc === currentTrack.src) return

    hasCanPlayRef.current = false
    usePlayerStore.setState({ currentTime: 0, duration: 0, audioError: null })
    audio.src = currentTrack.src
    audio.load()
  }, [currentTrack?.id])

  // Play / pause — only when isPlaying toggles
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    if (isPlaying) {
      if (hasCanPlayRef.current || audio.readyState >= 2) {
        audio.play().catch(() => {})
      }
      // If not ready yet, the canplay handler will start playback
    } else {
      audio.pause()
    }
  }, [isPlaying])

  // Volume
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  const seekTo = useCallback((time) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = time
    usePlayerStore.setState({ currentTime: time })
  }, [])

  return { audioRef, seekTo }
}

export default useAudioEngine
