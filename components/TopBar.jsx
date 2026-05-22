import React from 'react'
import usePlayerStore from '../store/playerStore'

export default function TopBar() {
  const activeView = usePlayerStore(s => s.activeView)
  const isPlayerExpanded = usePlayerStore(s => s.isPlayerExpanded)
  const setActiveView = usePlayerStore(s => s.setActiveView)

  if (isPlayerExpanded) return null

  return (
    <header
      className="sticky top-0 z-30 flex items-center h-[72px] px-4 gap-2"
      style={{
        background: 'rgba(30, 32, 31, 0.96)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(68,73,57,0.25)',
        boxShadow: '0 4px 24px -8px rgba(0,0,0,0.4)',
      }}
    >
      {activeView === 'playlist' && (
        <button
onClick={() => setActiveView('home')}
            className="w-10 h-10 flex items-center justify-center text-on-surface hover:text-primary-fixed-dim transition-colors active:scale-90"
            aria-label="Back to home"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
      )}

      {/* Centered VADITRA title with flowing gradient */}
      <div className="flex-1 flex flex-col items-center justify-center select-none">
        <div className="relative inline-flex items-center justify-center">
          {/* Headphones coming out of left */}
          <span className="material-symbols-outlined absolute -left-[22px] -top-[2px] text-[11px] text-primary-fixed-dim rotate-[-20deg]" style={{ animation: 'blinkIcon 1s ease-in-out infinite', fontVariationSettings: "'FILL' 1" }}>headphones</span>
          <span
            className="text-[22px] font-black tracking-tighter italic font-syne leading-none relative z-10"
            style={{
              background: 'linear-gradient(90deg, #aed366, #c9f07e, #ffffff, #c9f07e, #aed366)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradientFlow 4s ease-in-out infinite',
            }}
          >
            VADITRA
          </span>
          {/* Notes coming out of right */}
          <span className="absolute -right-[18px] -top-[1px] text-[11px] text-primary-fixed-dim/80 rotate-[15deg]" style={{ animation: 'blinkIcon 1.2s ease-in-out infinite 0.3s' }}>♪</span>
          <span className="absolute -right-[32px] top-[2px] text-[9px] text-primary-fixed-dim/50 rotate-[30deg]" style={{ animation: 'blinkIcon 0.8s ease-in-out infinite 0.5s' }}>♫</span>
        </div>
      </div>

    </header>
  )
}
