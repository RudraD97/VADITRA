import React, { useMemo } from 'react'

const BAR_COUNT = 16

export default function Visualizer({ frequencyData, isPlaying, className = '' }) {
  const bars = useMemo(() => {
    if (!frequencyData || frequencyData.length === 0) {
      return Array(BAR_COUNT).fill(4)
    }

    const total = frequencyData.length
    const heights = []

    for (let i = 0; i < BAR_COUNT; i++) {
      // Logarithmic binning: lower frequencies (bass) get more bins
      // This makes the bars react more visibly to kick drums and bass lines.
      const start = Math.floor(Math.pow(i / BAR_COUNT, 1.8) * total)
      const end = Math.floor(Math.pow((i + 1) / BAR_COUNT, 1.8) * total)
      const slice = frequencyData.slice(start, Math.min(end + 1, total))

      let avg = 0
      if (slice.length > 0) {
        let sum = 0
        for (let j = 0; j < slice.length; j++) sum += slice[j]
        avg = sum / slice.length
      }

      // Power curve: emphasises peaks, quiets noise
      const normalized = avg / 255
      heights.push(Math.max(3, Math.floor(Math.pow(normalized, 0.55) * 46)))
    }

    return heights
  }, [frequencyData])

  return (
    <div className={`flex items-end justify-center gap-[3px] h-12 ${className}`}>
      {bars.map((height, i) => (
        <div
          key={i}
          className="w-[4px] rounded-sm"
          style={{
            height: `${height}px`,
            background: 'linear-gradient(to top, #7b9e3a, #aed366, #c9f07e)',
            transition: `height ${isPlaying ? '0.08s' : '0.35s'} cubic-bezier(0.34, 1.56, 0.64, 1)`,
            opacity: isPlaying ? 0.95 : 0.3,
            transformOrigin: 'bottom',
            willChange: 'height',
          }}
        />
      ))}
    </div>
  )
}
