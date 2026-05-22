// useSeekBar.js — Handles click and drag interactions on the seek bar
// Usage: const { barRef, isSeeking, handleBarClick, handleBarMouseDown } = useSeekBar(seekTo)

import { useRef, useState, useCallback, useEffect } from 'react'
import usePlayerStore from '../store/playerStore'
import { getProgress } from '../utils/audioUtils'

export function useSeekBar(seekTo) {
  const barRef = useRef(null)
  const [isSeeking, setIsSeeking] = useState(false)
  const [seekPreview, setSeekPreview] = useState(0) // 0-100 percent

  const duration = usePlayerStore(s => s.duration)
  const currentTime = usePlayerStore(s => s.currentTime)

  const getRatioFromEvent = useCallback((e) => {
    if (!barRef.current) return 0
    const rect = barRef.current.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }, [])

  // Click to seek
  const handleBarClick = useCallback((e) => {
    if (!duration) return
    const ratio = getRatioFromEvent(e)
    seekTo(ratio * duration)
  }, [duration, getRatioFromEvent, seekTo])

  // Mouse/touch drag to seek
  const handleBarMouseDown = useCallback((e) => {
    if (!duration) return
    e.preventDefault()
    setIsSeeking(true)

    const onMove = (moveEvent) => {
      const ratio = getRatioFromEvent(moveEvent)
      setSeekPreview(ratio * 100)
    }

    const onUp = (upEvent) => {
      const ratio = getRatioFromEvent(upEvent)
      seekTo(ratio * duration)
      setIsSeeking(false)
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
    }

    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', onUp)
  }, [duration, getRatioFromEvent, seekTo])

  // Display progress (use seekPreview while dragging)
  const displayProgress = isSeeking
    ? seekPreview
    : getProgress(currentTime, duration)

  return {
    barRef,
    isSeeking,
    displayProgress,
    handleBarClick,
    handleBarMouseDown,
  }
}

export default useSeekBar
