// BottomNav.jsx — Fixed bottom navigation bar (matches your HTML design)
import React from 'react'
import usePlayerStore from '../store/playerStore'

const NAV_ITEMS = [
  { view: 'home', icon: 'home', label: 'Home', filled: true },
  { view: 'search', icon: 'search', label: 'Search', filled: false },
  { view: 'downloads', icon: 'download', label: 'Downloads', filled: true },
  { view: 'profile', icon: 'person', label: 'Profile', filled: true },
]

export default function BottomNav() {
  const activeView = usePlayerStore(s => s.activeView)
  const setActiveView = usePlayerStore(s => s.setActiveView)
  const setPlayerExpanded = usePlayerStore(s => s.setPlayerExpanded)

  const handleNavClick = (view) => {
    setPlayerExpanded(false)
    setActiveView(view)
  }

  return (
    <nav
      className="fixed bottom-0 w-full z-50 h-[66px] backdrop-blur-xl flex items-center px-6"
      style={{
        background: 'rgba(30, 32, 31, 0.96)',
        borderTop: '1px solid rgba(68,73,57,0.25)',
        boxShadow: '0 -4px 24px -8px rgba(0,0,0,0.4)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      <div className="flex-1 flex justify-evenly items-center max-w-sm mx-auto w-full">
        {NAV_ITEMS.map(({ view, icon, label, filled }) => {
          const isActive = activeView === view
          return (
            <button
              key={view}
              onClick={() => handleNavClick(view)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[55px] min-h-[48px] transition-all duration-200 active:scale-90 ${
                isActive ? 'text-primary-fixed-dim' : 'text-on-surface-variant/60 hover:text-primary-fixed-dim'
              }`}
              aria-label={label}
            >
              <span
                className="material-symbols-outlined text-[24px]"
                style={{ fontVariationSettings: isActive && filled ? "'FILL' 1" : "'FILL' 0" }}
              >
                {icon}
              </span>
              <span className="text-[10px] font-inter tracking-wider">{label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full bg-primary-fixed-dim mt-0.5" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
