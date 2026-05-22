import React from 'react'
import usePlayerStore from '../store/playerStore'

const NAV_ITEMS = [
  { view: 'home', icon: 'home', label: 'Home' },
  { view: 'search', icon: 'search', label: 'Search' },
  { view: 'player', icon: 'slow_motion_video', label: 'Playing' },
  { view: 'upload', icon: 'upload', label: 'Upload' },
]

export default function Sidebar({ isOpen, onClose }) {
  const activeView = usePlayerStore(s => s.activeView)
  const setActiveView = usePlayerStore(s => s.setActiveView)
  const setPlayerExpanded = usePlayerStore(s => s.setPlayerExpanded)

  const handleNavClick = (view) => {
    if (view === 'player') {
      setPlayerExpanded(true)
    } else {
      setPlayerExpanded(false)
      setActiveView(view)
    }
    onClose?.()
  }

  const content = (
    <div
      className="flex flex-col h-full backdrop-blur-xl"
      style={{
        background: 'rgba(30, 32, 31, 0.96)',
      }}
    >
      <div className="flex items-center justify-center h-[72px] flex-shrink-0" style={{ borderBottom: '1px solid rgba(68, 73, 57, 0.25)' }}>
        <div className="flex items-center justify-center">
          <span className="text-[16px] font-black tracking-tighter text-primary-fixed-dim uppercase italic font-syne">M</span>
        </div>
      </div>

      <nav className="flex-1 flex flex-col items-center gap-1 py-6 px-2">
        {NAV_ITEMS.map(({ view, icon, label }) => {
          const isActive = activeView === view || (view === 'player' && usePlayerStore.getState().isPlayerExpanded)
          return (
            <button
              key={view}
              onClick={() => handleNavClick(view)}
              className={`w-full flex flex-col items-center gap-1 py-3 px-1 rounded-xl transition-all duration-200 active:scale-90 ${
                isActive
                  ? 'text-primary-fixed-dim bg-primary-fixed-dim/10'
                  : 'text-on-surface-variant/60 hover:text-primary-fixed-dim hover:bg-surface-container'
              }`}
              aria-label={label}
            >
              <span
                className="material-symbols-outlined text-[22px]"
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {icon}
              </span>
              <span className="text-[9px] font-inter tracking-wider uppercase">{label}</span>
            </button>
          )
        })}
      </nav>

      <div className="flex-shrink-0 py-4 flex justify-center" style={{ borderTop: '1px solid rgba(68, 73, 57, 0.25)' }}>
        <div className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant/20 bg-surface-container flex items-center justify-center">
          <span className="material-symbols-outlined text-on-surface-variant/60 text-[16px]">person</span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop: always visible */}
      <aside className="hidden md:flex w-[66px] flex-shrink-0 min-h-screen sticky top-0 z-40">
        {content}
      </aside>

      {/* Mobile: overlay drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={onClose}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <aside
            className="relative w-[240px] h-full shadow-2xl"
            onClick={e => e.stopPropagation()}
            style={{ background: 'rgba(30, 32, 31, 0.96)' }}
          >
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
