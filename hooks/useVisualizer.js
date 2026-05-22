// useVisualizer.js — Web Audio API frequency analyser
// Returns frequencyData array for animating visualizer bars
// Usage: const { frequencyData, initContext } = useVisualizer(audioRef)

import { useEffect, useRef, useState, useCallback } from 'react'
import usePlayerStore from '../store/playerStore'

export function useVisualizer(audioRef) {
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceNodeRef = useRef(null)
  const animFrameRef = useRef(null)
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(128))
  const [isReady, setIsReady] = useState(false)

  // Initialize AudioContext lazily (requires user gesture)
  const initContext = useCallback(() => {
    if (audioContextRef.current) return

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256           // 128 frequency bins — better beat resolution
      analyser.smoothingTimeConstant = 0.65  // less smoothing = snappier transients
      analyser.minDecibels = -85
      analyser.maxDecibels = -10

      audioContextRef.current = ctx
      analyserRef.current = analyser

      if (audioRef.current && !sourceNodeRef.current) {
        const source = ctx.createMediaElementSource(audioRef.current)
        source.connect(analyser)
        analyser.connect(ctx.destination)
        sourceNodeRef.current = source
      }

      setIsReady(true)
    } catch (err) {
      console.warn('Web Audio API not available:', err)
    }
  }, [audioRef])

  // Auto-init from the isPlaying subscriber — happens inside user gesture
  useEffect(() => {
    const unsub = usePlayerStore.subscribe(
      (state) => state.isPlaying,
      (isPlaying) => {
        if (isPlaying) {
          initContext()
          if (audioContextRef.current?.state === 'suspended') {
            audioContextRef.current.resume()
          }
        }
      }
    )
    return unsub
  }, [initContext])

  // Animation loop
  useEffect(() => {
    if (!isReady || !analyserRef.current) return

    const analyser = analyserRef.current
    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const tick = () => {
      if (usePlayerStore.getState().isPlaying) {
        analyser.getByteFrequencyData(dataArray)
        setFrequencyData(new Uint8Array(dataArray))
      } else {
        // Decay bars when paused
        setFrequencyData(prev => {
          const decayed = new Uint8Array(prev.length)
          for (let i = 0; i < prev.length; i++) {
            decayed[i] = prev[i] > 6 ? prev[i] - 6 : 0
          }
          return decayed
        })
      }
      animFrameRef.current = requestAnimationFrame(tick)
    }

    animFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [isReady])

  // Fallback: simulated data when Web Audio hasn't been initialised yet
  const simRef = useRef(new Uint8Array(128))
  const getFallback = useCallback(() => {
    const playing = usePlayerStore.getState().isPlaying
    if (!playing) return new Uint8Array(128)

    const prev = simRef.current
    const d = new Uint8Array(128)
    for (let i = 0; i < 128; i++) {
      const peak = i < 20 ? Math.random() * 200 + 40 : Math.random() * 120 + 10
      d[i] = Math.floor(prev[i] * 0.55 + peak * 0.45)
    }
    simRef.current = d
    return d
  }, [])

  return {
    frequencyData: isReady ? frequencyData : getFallback(),
    initContext,
    isReady,
  }
}

export default useVisualizer
