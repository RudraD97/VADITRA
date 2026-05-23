// App.jsx — Root component: wires audio engine, routing, and layout
import React, { useEffect, useState } from 'react'
import usePlayerStore from './store/playerStore'
import { useAudioEngine } from './hooks/useAudioEngine'
import { useVisualizer } from './hooks/useVisualizer'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useSeekBar } from './hooks/useSeekBar'
import { getAllAudioFiles } from './utils/indexedDB'
import notifyDevice from './utils/deviceNotify'

// Pages
import LibraryPage from './pages/LibraryPage'
import SearchPage from './pages/SearchPage'
import PlaylistPage from './pages/PlaylistPage'
import PlayerPage from './pages/PlayerPage'
import UploadPage from './pages/UploadPage'
import DownloadPage from './pages/DownloadPage'
import ProfilePage from './pages/ProfilePage'

import LandingPage from './pages/LandingPage'

// Shared layout
import TopBar from './components/TopBar'
import BottomNav from './components/BottomNav'
import MiniPlayer from './components/MiniPlayer'

export default function App() {
  const [landingDone, setLandingDone] = useState(false)
  const [restoring, setRestoring] = useState(true)
  const activeView = usePlayerStore(s => s.activeView)
  const isPlayerExpanded = usePlayerStore(s => s.isPlayerExpanded)
  const library = usePlayerStore(s => s.library)
  const restoreTrackSrc = usePlayerStore(s => s.restoreTrackSrc)

  useEffect(() => { notifyDevice() }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const files = await getAllAudioFiles()
      if (cancelled) return
      for (const file of files) {
        const url = URL.createObjectURL(file.data)
        const coverUrl = file.cover ? URL.createObjectURL(file.cover) : null
        restoreTrackSrc(file.id, url, coverUrl)
      }
      setRestoring(false)
    })()
    return () => { cancelled = true }
  }, [])

  const { audioRef, seekTo } = useAudioEngine()
  const { frequencyData, initContext } = useVisualizer(audioRef)
  const seekBarProps = useSeekBar(seekTo)
  useKeyboardShortcuts(seekTo)

  const sharedProps = { frequencyData, seekTo, seekBarProps, initContext }

  if (!landingDone) {
    return <LandingPage onEnter={() => setLandingDone(true)} />
  }

  if (restoring) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-[48px] text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>music_note</span>
          <p className="text-on-surface-variant/50 text-[14px] font-inter">Loading your library...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="relative min-h-screen bg-background text-on-surface font-body-md overflow-x-hidden"
    >

      {/* ── Main Content Area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-0 relative">

        {/* Top Bar — always in DOM but invisible when player expanded to prevent layout shift */}
        <div style={{ visibility: isPlayerExpanded ? 'hidden' : 'visible' }}>
          <TopBar />
        </div>

        {/* Page content — reserve space for MiniPlayer + BottomNav so size never changes */}
        <div className="flex-1" style={{ paddingBottom: isPlayerExpanded ? '0px' : '136px' }}>
          <div style={{ display: activeView === 'home' ? '' : 'none' }}><LibraryPage {...sharedProps} /></div>
          <div style={{ display: activeView === 'search' ? '' : 'none' }}><SearchPage {...sharedProps} /></div>
          <div style={{ display: activeView === 'playlist' ? '' : 'none' }}><PlaylistPage {...sharedProps} /></div>
          <div style={{ display: activeView === 'upload' ? '' : 'none' }}><UploadPage {...sharedProps} /></div>
          <div style={{ display: activeView === 'downloads' ? '' : 'none' }}><DownloadPage {...sharedProps} /></div>
          <div style={{ display: activeView === 'profile' ? '' : 'none' }}><ProfilePage /></div>
        </div>

        {/* Mini Player — wrapped so it still exists in DOM when hidden (prevents re-mount) */}
        <div style={{ display: isPlayerExpanded ? 'none' : 'block' }}>
          <MiniPlayer {...sharedProps} />
        </div>

        {/* Bottom Navigation — hidden when PlayerPage is open (PlayerPage has its own) */}
        <div style={{ display: isPlayerExpanded ? 'none' : 'block' }}>
          <BottomNav />
        </div>

      </div>

      {/* ── Now Playing: full-screen overlay ────────────────────────────── */}
      {isPlayerExpanded && (
        <PlayerPage {...sharedProps} />
      )}

    </div>
  )
}
