import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import usePlayerStore from '../store/playerStore'
import { formatTime, DEFAULT_COVER } from '../utils/audioUtils'
import { searchOnlineSongs, getRecommendations } from '../utils/jiosaavnApi'
import useOnlineStatus from '../hooks/useOnlineStatus'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [mode, setMode] = useState(navigator.onLine ? 'online' : 'local')
  const [onlineResults, setOnlineResults] = useState([])
  const [onlineLoading, setOnlineLoading] = useState(false)
  const [onlineError, setOnlineError] = useState(null)
  const [recommendations, setRecommendations] = useState([])
  const [recsLoading, setRecsLoading] = useState(false)
  const [recsError, setRecsError] = useState(null)
  const onlineTimer = useRef(null)
  const inputRef = useRef(null)
  const library = usePlayerStore(s => s.library)
  const playlists = usePlayerStore(s => s.playlists)
  const currentTrack = usePlayerStore(s => s.currentTrack)
  const isPlaying = usePlayerStore(s => s.isPlaying)
  const setQueue = usePlayerStore(s => s.setQueue)
  const setPlayerExpanded = usePlayerStore(s => s.setPlayerExpanded)

  const handleOnlineSearch = useCallback((q) => {
    if (onlineTimer.current) clearTimeout(onlineTimer.current)
    if (!q.trim()) { setOnlineResults([]); setOnlineError(null); setOnlineLoading(false); return }
    setOnlineLoading(true)
    setOnlineError(null)
    onlineTimer.current = setTimeout(async () => {
      const result = await searchOnlineSongs(q)
      if (result.success) {
        setOnlineResults(result.data)
        setOnlineError(null)
      } else {
        setOnlineResults([])
        setOnlineError(result.error || 'Search is temporarily unavailable')
      }
      setOnlineLoading(false)
    }, 400)
  }, [])

  const [recsVersion, setRecsVersion] = useState(0)

  const fetchRecommendations = useCallback(() => {
    setRecsLoading(true)
    setRecsError(null)
    getRecommendations().then(result => {
      if (result.success) {
        setRecommendations(result.data)
        setRecsError(null)
      } else {
        setRecommendations([])
        setRecsError(result.error || 'Recommendations unavailable')
      }
      setRecsLoading(false)
    })
  }, [library])

  const handleRefreshRecs = useCallback(() => {
    setRecsVersion(v => v + 1)
  }, [])

  const isOnline = useOnlineStatus()

  useEffect(() => {
    if (isOnline && mode === 'online' && !query.trim()) {
      fetchRecommendations()
    }
  }, [isOnline, mode, query, recsVersion])

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
            onChange={e => { const v = e.target.value; setQuery(v); if (mode === 'online') handleOnlineSearch(v) }}
            className="flex-1 bg-transparent text-on-surface text-[16px] font-inter outline-none placeholder:text-on-surface-variant/30"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-on-surface-variant/40 hover:text-on-surface transition-colors">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          )}
        </div>

        {/* ── Mode Toggle: Library | Explore ── */}
        <div className="flex items-center gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(30, 32, 31, 0.6)' }}>
          <button
            onClick={() => { setMode('local'); setOnlineResults([]); setOnlineError(null); setRecsError(null) }}
            className="flex-1 py-2 text-[13px] font-inter font-medium rounded-lg transition-all"
            style={{ background: mode === 'local' ? 'rgba(174,211,102,0.12)' : 'transparent', color: mode === 'local' ? '#aed366' : 'rgba(226,227,224,0.5)' }}
          >
            My Library
          </button>
          <button
            onClick={() => { setMode('online'); if (query.trim()) handleOnlineSearch(query); else handleRefreshRecs() }}
            className="flex-1 py-2 text-[13px] font-inter font-medium rounded-lg transition-all"
            style={{ background: mode === 'online' ? 'rgba(174,211,102,0.12)' : 'transparent', color: mode === 'online' ? '#aed366' : 'rgba(226,227,224,0.5)' }}
          >
            Explore
          </button>
        </div>

        {/* ── Empty state (local mode) ── */}
        {mode === 'local' && !query.trim() && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="material-symbols-outlined text-[56px] text-on-surface-variant/20 mb-4">search</span>
            <p className="text-on-surface-variant/50 font-inter text-[15px]">Search your music library</p>
          </div>
        )}

        {/* ── No results (local mode) ── */}
        {mode === 'local' && query.trim() && results.tracks.length === 0 && results.playlists.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20 mb-3">music_off</span>
            <p className="text-on-surface-variant/50 font-inter text-[15px]">No results for "{query}"</p>
            <p className="text-on-surface-variant/30 font-inter text-[13px] mt-1">Try a different search term</p>
          </div>
        )}

        {/* ── Playlist results (local mode) ── */}
        {mode === 'local' && results.playlists.length > 0 && (
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

        {/* ── Track results (local mode) ── */}
        {mode === 'local' && results.tracks.length > 0 && (
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

                    {/* Duration / playing indicator + offline badge */}
                    <div className="flex-shrink-0 flex items-center gap-2">
                      {isCurrentPlaying ? (
                        <span className="material-symbols-outlined text-primary-fixed-dim text-[18px] w-[3.25rem] text-right" style={{ fontVariationSettings: "'FILL' 1" }}>equalizer</span>
                      ) : (
                        <span className="inline-block w-[3.25rem] text-right text-[12px] text-on-surface-variant/40 font-inter tabular-nums">
                          {formatTime(track.duration)}
                        </span>
                      )}
                      {track._isDownloaded && (
                        <span className="material-symbols-outlined text-[14px] text-primary-fixed-dim/60">download</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── Online section ── */}
        {mode === 'online' && (
          <>
            {/* Offline banner */}
            {!isOnline && (
              <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl" style={{ background: 'rgba(242, 139, 130, 0.1)', border: '1px solid rgba(242, 139, 130, 0.2)' }}>
                <span className="material-symbols-outlined text-[20px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>wifi_off</span>
                <div>
                  <p className="text-[13px] font-medium font-inter text-error">You are offline</p>
                  <p className="text-[11px] font-inter text-error/70">Connect to the internet to search Explore</p>
                </div>
              </div>
            )}

            {/* API error banner */}
            {isOnline && (onlineError || recsError) && !query.trim() && (
              <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl" style={{ background: 'rgba(242, 139, 130, 0.1)', border: '1px solid rgba(242, 139, 130, 0.2)' }}>
                <span className="material-symbols-outlined text-[20px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_off</span>
                <div className="flex-1">
                  <p className="text-[13px] font-medium font-inter text-error">Online search unavailable</p>
                  <p className="text-[11px] font-inter text-error/70">{recsError || onlineError}</p>
                </div>
                <button onClick={handleRefreshRecs} className="px-3 py-1.5 rounded-lg text-[12px] font-medium font-inter text-error hover:bg-error/10 transition-colors active:scale-95">
                  Retry
                </button>
              </div>
            )}

            {/* Online search error banner */}
            {isOnline && onlineError && query.trim() && (
              <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl" style={{ background: 'rgba(242, 139, 130, 0.1)', border: '1px solid rgba(242, 139, 130, 0.2)' }}>
                <span className="material-symbols-outlined text-[20px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_off</span>
                <div className="flex-1">
                  <p className="text-[13px] font-medium font-inter text-error">Search failed</p>
                  <p className="text-[11px] font-inter text-error/70">{onlineError}</p>
                </div>
                <button onClick={() => handleOnlineSearch(query)} className="px-3 py-1.5 rounded-lg text-[12px] font-medium font-inter text-error hover:bg-error/10 transition-colors active:scale-95">
                  Retry
                </button>
              </div>
            )}

            {/* Online empty state — recommendations */}
            {!query.trim() && (
              <>
                {recsLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="material-symbols-outlined text-[36px] text-primary-fixed-dim/50 mb-3 animate-spin">autorenew</span>
                    <p className="text-on-surface-variant/40 font-inter text-[13px]">Loading recommendations...</p>
                  </div>
                ) : recommendations.length > 0 ? (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[12px] text-on-surface-variant uppercase tracking-[0.1em] font-inter font-medium">
                        Recommended for you ({recommendations.length})
                      </h3>
                      <button onClick={handleRefreshRecs} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-on-surface-variant/40 hover:text-primary-fixed-dim">
                        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>refresh</span>
                      </button>
                    </div>
                    <div className="space-y-1">
                      {recommendations.map((track, index) => {
                        const isCurrentTrack = currentTrack?.id === track.id
                        const isCurrentPlaying = isCurrentTrack && isPlaying
                        return (
                          <div
                            key={track.id}
                            className="group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-surface-container active:scale-[0.98]"
                            onClick={() => { setQueue(recommendations, index); setPlayerExpanded(true) }}
                          >
                            <div className="w-11 h-11 rounded-lg overflow-hidden bg-surface-variant flex-shrink-0">
                              <img src={track.cover || DEFAULT_COVER} alt="" className="w-full h-full object-cover" onError={e => { if (e.target.src !== DEFAULT_COVER) e.target.src = DEFAULT_COVER }} />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="text-[15px] font-semibold truncate font-syne leading-tight" style={{ color: isCurrentTrack ? '#aed366' : '#e2e3e0' }}>
                                {track.title}
                              </p>
                              <p className="text-[12px] text-on-surface-variant/60 truncate font-inter">{track.artist}</p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2">
                              <span className="text-[10px] font-inter px-1.5 py-0.5 rounded text-primary-fixed-dim/60" style={{ background: 'rgba(174,211,102,0.08)', border: '1px solid rgba(174,211,102,0.15)' }}>
                                {track._language || 'stream'}
                              </span>
                              {isCurrentPlaying ? (
                                <span className="material-symbols-outlined text-primary-fixed-dim text-[18px] w-[3.25rem] text-right" style={{ fontVariationSettings: "'FILL' 1" }}>equalizer</span>
                              ) : (
                                <span className="inline-block w-[3.25rem] text-right text-[12px] text-on-surface-variant/40 font-inter tabular-nums">{formatTime(track.duration)}</span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    {!isOnline ? (
                      <>
                        <span className="material-symbols-outlined text-[56px] text-on-surface-variant/20 mb-4">wifi_off</span>
                        <p className="text-on-surface-variant/50 font-inter text-[15px]">Connect to the internet to explore</p>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[56px] text-on-surface-variant/20 mb-4">explore</span>
                        <p className="text-on-surface-variant/50 font-inter text-[15px]">Search songs on Explore</p>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Online loading */}
            {onlineLoading && query.trim() && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="material-symbols-outlined text-[36px] text-primary-fixed-dim/50 mb-3 animate-spin">autorenew</span>
                <p className="text-on-surface-variant/40 font-inter text-[13px]">Searching Explore...</p>
              </div>
            )}

            {/* Online no results (only when no error) */}
            {!onlineLoading && !onlineError && query.trim() && onlineResults.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20 mb-3">music_off</span>
                <p className="text-on-surface-variant/50 font-inter text-[15px]">No online results for "{query}"</p>
                <p className="text-on-surface-variant/30 font-inter text-[13px] mt-1">Try a different search term</p>
              </div>
            )}

            {/* Online track results */}
            {onlineResults.length > 0 && (
              <section>
                <h3 className="text-[12px] text-on-surface-variant uppercase tracking-[0.1em] font-inter font-medium mb-3">
                  Explore ({onlineResults.length})
                </h3>
                <div className="space-y-1">
                  {onlineResults.map((track, index) => {
                    const isCurrentTrack = currentTrack?.id === track.id
                    const isCurrentPlaying = isCurrentTrack && isPlaying
                    return (
                      <div
                        key={track.id}
                        className="group flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all duration-200 hover:bg-surface-container active:scale-[0.98]"
                        onClick={() => { setQueue(onlineResults, index); setPlayerExpanded(true) }}
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

                        {/* Badge + Duration / playing indicator */}
                        <div className="flex-shrink-0 flex items-center gap-2">
                          <span className="text-[10px] font-inter px-1.5 py-0.5 rounded text-primary-fixed-dim/60" style={{ background: 'rgba(174,211,102,0.08)', border: '1px solid rgba(174,211,102,0.15)' }}>
                            {track._language || 'stream'}
                          </span>
                          {isCurrentPlaying ? (
                            <span className="material-symbols-outlined text-primary-fixed-dim text-[18px] w-[3.25rem] text-right" style={{ fontVariationSettings: "'FILL' 1" }}>equalizer</span>
                          ) : (
                            <span className="inline-block w-[3.25rem] text-right text-[12px] text-on-surface-variant/40 font-inter tabular-nums">
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
          </>
        )}
      </div>
    </div>
  )
}
