// useKeyboardShortcuts.js — Global keyboard shortcuts for player
// Space = play/pause, Arrow keys = seek/volume, M = mute, etc.

import { useEffect } from 'react'
import usePlayerStore from '../store/playerStore'

export function useKeyboardShortcuts(seekTo) {
  const { togglePlay, playNext, playPrevious, toggleMute, setVolume, volume } = usePlayerStore()

  useEffect(() => {
    const handler = (e) => {
      // Don't fire when typing in an input
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      const { currentTime, duration } = usePlayerStore.getState()

      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowRight':
          e.preventDefault()
          if (seekTo && duration) seekTo(Math.min(duration, currentTime + 5))
          break
        case 'ArrowLeft':
          e.preventDefault()
          if (seekTo && duration) seekTo(Math.max(0, currentTime - 5))
          break
        case 'ArrowUp':
          e.preventDefault()
          setVolume(Math.min(1, volume + 0.05))
          break
        case 'ArrowDown':
          e.preventDefault()
          setVolume(Math.max(0, volume - 0.05))
          break
        case 'KeyM':
          toggleMute()
          break
        case 'KeyN':
          playNext()
          break
        case 'KeyP':
          playPrevious()
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [seekTo, volume, togglePlay, playNext, playPrevious, toggleMute, setVolume])
}

export default useKeyboardShortcuts
