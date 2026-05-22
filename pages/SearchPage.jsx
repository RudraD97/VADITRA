import React, { useState, useMemo, useRef, useEffect } from 'react'
import usePlayerStore from '../store/playerStore'
import { formatTime, DEFAULT_COVER } from '../utils/audioUtils'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const library = usePlayerStore(s => s.library)
  const playlists = usePlayerStore(s => s.playlists)
  const currentTrack = usePlayerStore(s => s.currentTrack)
  const isPlaying = usePlayerStore(s => s.isPlaying)
  const setQueue = usePlayerStore(s => s.setQueue)
  const setPlayerExpanded = usePlayerStore(s => s.setPlayerExpanded)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const results = useMemo(() => {
    if (!query.trim()) return { tracks: [], playlists: [] }
    const q = query.toLowerCase().trim()
    const tracks = library.filter(t =>
      (t.title || '').toLowerCase().includes(q) ||
      (t.artist || '').toLowerCase().includes(q) ||
      (t.album || '').toLowerCase().includes(q) ||
      (t.fileName || '').toLowerCase().includes(q)
    )
    const matchedPlaylists = playlists.filter(p =>
      (p.name || '').toLowerCase().includes(q)
    )
    return { tracks, playlists: matchedPlaylists }
  }, [query, library, playlists])

  const handlePlayTrack = (index) => {
    setQueue(results.tracks, index)
    setPlayerExpanded(true)
  }

  return (
    <div style={{ animation: 'pageEnter 0.3s ease-out forwards' }}>
      <div className="max-w-3xl mx-auto px-5 pt-6">

        {/* Search Input */}
        <div
          className="flex items-center gap-3 p-3 rounded-xl mb-6"
          style={{
            background: 'rgba(30, 32, 31, 0.8)',
            border: '1px solid rgba(68, 73, 57, 0.2)',
          }}
        >
          <span className="material-symbols-outlined text-on-surface-variant/40">search</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search tracks, artists, albums..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-on-surface text-[16px] font-inter outline-none placeholder:text-on-surface-variant/30"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-on-surface-variant/40 hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* Empty state */}
        {!query.trim() && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-[56px] text-on-surface-variant/20 mb-4">search</span>
            <p className="text-on-surface-variant/50 font-inter text-[15px]">Search your music library</p>
          </div>
        )}

        {/* No results */}
        {query.trim() && results.tracks.length === 0 && results.playlists.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20 mb-3">music_off</span>
            <p className="text-on-surface-variant/50 font-inter text-[15px]">No results for "{query}"</p>
            <p className="text-on-surface-variant/30 font-inter text-[13px] mt-1">Try a different search term</p>
          </div>
        )}

        {/* Playlist results */}
        {results.playlists.length > 0 && (
          <section className="mb-8">
            <h3 className="text-[12px] text-on-surface-variant uppercase tracking-[0.1em] font-inter font-medium mb-3">
              Playlists ({results.playlists.length})
            </h3>
            <div className="space-y-2">
              {results.playlists.map(pl => (
                <div
                  key={pl.id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-surface-container-low/40 hover:bg-surface-container transition-all cursor-pointer active:scale-[0.98]"
                >
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-variant flex-shrink-0">
                    <img src={DEFAULT_COVER} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-[15px] font-semibold text-on-surface truncate font-syne">{pl.name}</p>
                    <p className="text-[12px] text-on-surface-variant/60 font-inter">{pl.tracks?.length || 0} tracks</p>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant/30 text-[20px]">chevron_right</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Track results */}
        {results.tracks.length > 0 && (
          <section>
            <h3 className="text-[12px] text-on-surface-variant uppercase tracking-[0.1em] font-inter font-medium mb-3">
              Tracks ({results.tracks.length})
            </h3>
            <div className="space-y-1">
              {results.tracks.map((track, index) => {
                const isCurrentTrack = currentTrack?.id === track.id
                const isCurrentPlaying = isCurrentTrack && isPlaying
                return (
                  <div
                    key={track.id}
                    className="group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-surface-container active:scale-[0.98]"
                    onClick={() => handlePlayTrack(index)}
                  >
                    {/* Album art */}
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-surface-variant flex-shrink-0">
                      <img src={track.cover || DEFAULT_COVER} alt="" className="w-full h-full object-cover" onError={e => { if (e.target.src !== DEFAULT_COVER) e.target.src = DEFAULT_COVER }} />
                    </div>

                    {/* Info */}
                    <div className="flex-1 overflow-hidden">
                      <p
                        className="text-[15px] font-semibold truncate font-syne leading-tight"
                        style={{ color: isCurrentTrack ? '#aed366' : '#e2e3e0' }}
                      >
                        {track.title}
                      </p>
                      <p className="text-[12px] text-on-surface-variant/60 truncate font-inter">
                        {track.artist}
                      </p>
                    </div>

                    {/* Duration / playing indicator */}
                    <div className="flex-shrink-0 text-right">
                      {isCurrentPlaying ? (
                        <span className="material-symbols-outlined text-primary-fixed-dim text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>equalizer</span>
                      ) : (
                        <span className="text-[12px] text-on-surface-variant/40 font-inter tabular-nums">
                          {formatTime(track.duration)}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
