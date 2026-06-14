// useVisualizer.js — Web Audio API frequency analyser + built-in equalizer
// Returns frequencyData array for animating visualizer bars
// Usage: const { frequencyData, initContext } = useVisualizer(audioRef)

import { useEffect, useRef, useState, useCallback } from 'react'
import usePlayerStore from '../store/playerStore'

export const EQ_PRESETS = {
  Flat:      [ 0.0,  0.0,  0.0,  0.0,  0.0],
  Rock:      [ 3.0,  1.5, -0.5,  1.0,  3.0],
  Pop:       [-0.5,  2.0,  3.0,  2.5, -0.5],
  Jazz:      [ 2.5,  1.5,  0.0,  1.0,  2.0],
  Classical: [ 3.0,  2.0,  0.0,  1.5,  2.5],
  'Bass Boost': [ 5.0,  3.0,  0.0,  0.0,  0.0],
  Vocal:     [-1.0,  1.5,  3.5,  2.5, -0.5],
}

const EQ_BANDS = [
  { type: 'lowshelf',  freq:   60, Q: 0.7 },
  { type: 'peaking',   freq:  230, Q: 0.7 },
  { type: 'peaking',   freq:  910, Q: 0.7 },
  { type: 'peaking',   freq: 4000, Q: 0.7 },
  { type: 'highshelf', freq:12000, Q: 0.7 },
]

export function useVisualizer(audioRef) {
  const audioContextRef = useRef(null)
  const analyserRef = useRef(null)
  const sourceNodeRef = useRef(null)
  const eqChainRef = useRef(null)
  const animFrameRef = useRef(null)
  const [frequencyData, setFrequencyData] = useState(new Uint8Array(128))
  const [isReady, setIsReady] = useState(false)

  const applyEqPreset = useCallback((preset) => {
    if (!eqChainRef.current) return
    const gains = EQ_PRESETS[preset] || EQ_PRESETS.Flat
    const ctx = audioContextRef.current
    const now = ctx?.currentTime || 0
    eqChainRef.current.forEach((filter, i) => {
      filter.gain.linearRampToValueAtTime(gains[i], now + 0.03)
    })
  }, [])

  // Initialize AudioContext lazily (requires user gesture)
  const initContext = useCallback(async () => {
    if (audioContextRef.current) return

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      analyser.smoothingTimeConstant = 0.65
      analyser.minDecibels = -85
      analyser.maxDecibels = -10

      audioContextRef.current = ctx
      analyserRef.current = analyser

      if (audioRef.current && !sourceNodeRef.current) {
        const source = ctx.createMediaElementSource(audioRef.current)

        // Create 5-band EQ filter chain
        const eqFilters = EQ_BANDS.map(b => {
          const f = ctx.createBiquadFilter()
          f.type = b.type
          f.frequency.value = b.freq
          f.Q.value = b.Q
          f.gain.value = 0
          return f
        })

        // Master gain: -3dB headroom prevents clipping from EQ boosts
        const masterGain = ctx.createGain()
        masterGain.gain.value = 0.7

        // Connect: source → analyser → EQ chain → masterGain → destination
        source.connect(analyser)
        analyser.connect(eqFilters[0])
        for (let i = 0; i < eqFilters.length - 1; i++) {
          eqFilters[i].connect(eqFilters[i + 1])
        }
        eqFilters[eqFilters.length - 1].connect(masterGain)
        masterGain.connect(ctx.destination)

        sourceNodeRef.current = source
        eqChainRef.current = eqFilters

        // Apply current preset immediately
        const currentPreset = usePlayerStore.getState().eqPreset || 'Flat'
        const initialGains = EQ_PRESETS[currentPreset]
        eqFilters.forEach((filter, i) => {
          filter.gain.value = initialGains[i]
        })
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
      async (isPlaying) => {
        if (isPlaying) {
          await initContext()
        }
      }
    )
    return unsub
  }, [initContext])

  // Subscribe to EQ preset changes
  useEffect(() => {
    const unsub = usePlayerStore.subscribe(
      (state) => state.eqPreset,
      (preset) => applyEqPreset(preset)
    )
    return unsub
  }, [applyEqPreset])

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
