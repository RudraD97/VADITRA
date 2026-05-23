import React, { useState } from 'react'
import usePlayerStore from '../store/playerStore'
import { searchOnlineSongs, downloadOnlineTrack } from '../utils/jiosaavnApi'

const SEEDS = [
  'arijit singh', 'diljit dosanjh', 'shreya ghoshal', 'atif aslam', 'neha kakkar',
  'sidhu moose wala', 'taylor swift', 'weeknd', 'justin bieber', 'sza',
  'bollywood hits 2024', 'punjabi hits', 'indie pop 2024', 'lofi beats', 'trending english',
]

let seedIndex = 0

export default function ProfilePage() {
  const addToLibrary = usePlayerStore(s => s.addToLibrary)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleLoadSongs = async () => {
    setLoading(true)
    setDone(false)
    const seen = new Set()
    const songs = []
    let attempts = 0
    while (songs.length < 15 && attempts < 30) {
      const seed = SEEDS[seedIndex % SEEDS.length]
      seedIndex++
      attempts++
      const results = await searchOnlineSongs(seed, 8)
      for (const r of results) {
        if (songs.length >= 15) break
        const key = r.title?.toLowerCase().trim()
        if (!key || seen.has(key)) continue
        seen.add(key)
        songs.push(r)
      }
    }
    const downloaded = []
    for (const s of songs) {
      const result = await downloadOnlineTrack(s)
      if (result) downloaded.push(result)
    }
    if (downloaded.length > 0) addToLibrary(downloaded)
    setLoading(false)
    setDone(true)
  }

  return (
    <div style={{ animation: 'pageEnter 0.3s ease-out forwards' }}>
      <div className="max-w-3xl mx-auto px-5 pt-6 min-h-[80vh] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(174,211,102,0.1)' }}>
          <span className="material-symbols-outlined text-[40px] text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
        </div>
        <h1 className="text-[22px] font-bold font-syne text-[#e2e3e0] mb-2">Coming Soon</h1>
        <p className="text-[14px] text-on-surface-variant/50 font-inter max-w-xs mb-8">Profile, settings, and personalization features are on the way.</p>

        <button
          onClick={handleLoadSongs}
          disabled={loading}
          className="px-6 py-3 rounded-xl text-[13px] font-semibold font-inter transition-all active:scale-95 disabled:opacity-40"
          style={{ background: 'linear-gradient(135deg, #aed366, #c9f07e)', color: '#141f00' }}
        >
          {loading ? 'Downloading songs...' : done ? `Done! Check your library` : 'Load 15 test songs'}
        </button>
      </div>
    </div>
  )
}
