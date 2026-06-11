// MiniPlayer.jsx — Persistent mini player bar (matches your HTML design)
import React from 'react'
import usePlayerStore from '../store/playerStore'
import { formatTime, getProgress, DEFAULT_COVER } from '../utils/audioUtils'

export default function MiniPlayer({ seekBarProps }) {
  const {
    currentTrack, isPlaying, currentTime, duration,
    togglePlay, playNext, playPrevious,
    setPlayerExpanded,
  } = usePlayerStore()

  const audioError = usePlayerStore(s => s.audioError)

  if (!currentTrack) return null

  const progress = getProgress(currentTime, duration)

  return (
    <div className="fixed bottom-[66px] left-0 right-0 z-40 px-3 pb-1" style={{ touchAction: 'manipulation' }}>
      <div
        className="relative h-[64px] rounded-xl flex items-center px-4 gap-3 shadow-2xl overflow-hidden cursor-pointer"
        style={{
          background: 'rgba(40, 42, 41, 0.92)',
          backdropFilter: 'blur(24px)',
          border: '1px solid rgba(68, 73, 57, 0.3)',
        }}
        onClick={() => setPlayerExpanded(true)}
      >
        {/* Album Art */}
        <img
          src={currentTrack.cover || DEFAULT_COVER} onError={e => { if (e.target.src !== DEFAULT_COVER) e.target.src = DEFAULT_COVER }}
          alt="Now Playing"
          className="w-10 h-10 rounded-full object-cover flex-shrink-0 relative pointer-events-none"
        />

        {/* Track Info */}
        <div className="flex-1 overflow-hidden relative pointer-events-none">
          <p className="text-on-surface font-semibold text-[14px] truncate leading-tight">
            {currentTrack.title}
          </p>
          <p className="text-primary-fixed-dim text-[12px] truncate leading-tight">
            {currentTrack.artist}
          </p>
        </div>

        {/* Controls */}
        <div
          className="flex items-center gap-1 relative"
          onClick={e => { e.stopPropagation() }}
        >
          <button
            className="w-10 h-10 flex items-center justify-center text-on-surface hover:text-primary-fixed-dim transition-colors active:scale-90"
            onClick={playPrevious}
            aria-label="Previous"
          >
            <span className="material-symbols-outlined text-[22px]">skip_previous</span>
          </button>

          <button
            className="w-11 h-11 flex items-center justify-center text-primary-fixed-dim active:scale-90 transition-transform"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            <span
              className="material-symbols-outlined text-[40px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {isPlaying ? 'pause_circle' : 'play_circle'}
            </span>
          </button>

          <button
            className="w-10 h-10 flex items-center justify-center text-on-surface hover:text-primary-fixed-dim transition-colors active:scale-90"
            onClick={playNext}
            aria-label="Next"
          >
            <span className="material-symbols-outlined text-[22px]">skip_next</span>
          </button>
        </div>

        {/* Progress bar at bottom */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] rounded-b-xl overflow-hidden"
          style={{ background: 'rgba(68,73,57,0.3)' }}>
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #aed366, #c9f07e)',
              boxShadow: '0 0 6px rgba(174,211,102,0.4)',
            }}
          />
        </div>
      </div>

      {/* Audio error toast */}
      {audioError && (
        <div className="fixed bottom-[140px] left-4 right-4 z-50 p-3 rounded-xl text-center"
          style={{ background: 'rgba(147, 0, 10, 0.95)', backdropFilter: 'blur(12px)' }}
        >
          <p className="text-[13px] text-on-error-container font-inter">{audioError}</p>
        </div>
      )}
    </div>
  )
}
