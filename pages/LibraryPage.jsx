import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import usePlayerStore from '../store/playerStore'
import { useFileUpload } from '../hooks/useFileUpload'
import { DEFAULT_COVER } from '../utils/audioUtils'

const quotes = [
  '"Where words fail, music speaks."',
  '"Life is a song, love is the melody."',
  '"Music is the shorthand of emotion."',
  '"Without music, life would be a mistake."',
  '"One good thing about music — when it hits you, you feel no pain."',
  '"Music is the universal language of mankind."',
]

export default function LibraryPage() {
  const {
    library, setQueue, toggleLike, currentTrack, deleteTrack,
    playlists, createPlaylist, deletePlaylist, addTrackToPlaylist,
    setActivePlaylist, setActiveView, setPlayerExpanded,
  } = usePlayerStore()

  const { handleFiles, openFilePicker, onFileInputChange, fileInputRef } = useFileUpload()

  const [showNewPlaylist, setShowNewPlaylist] = useState(false)
  const [newName, setNewName] = useState('')
  const [addToPlaylistTrackId, setAddToPlaylistTrackId] = useState(null)
  const [menuTrackId, setMenuTrackId] = useState(null)
  const [playlistMenuId, setPlaylistMenuId] = useState(null)

  const quote = useMemo(() => quotes[Math.floor(Math.random() * quotes.length)], [])

  const sorted = useMemo(() => [...library].reverse(), [library])
  const likedTracks = useMemo(() => library.filter(t => t.liked), [library])

  const sectionRef = useRef(null)

  const handlePlay = (index) => {
    setQueue(sorted, index)
    setPlayerExpanded(true)
  }

  const handleShare = useCallback(async (track) => {
    const shareTitle = `${track.title || 'Unknown'} - VDK`
    try {
      const blob = new Blob([await fetch(track.src).then(r => r.blob())], { type: 'audio/mpeg' })
      const file = new File([blob], `${shareTitle}.vdk`, { type: blob.type })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: shareTitle })
        return
      }
    } catch {}
    try {
      await navigator.share({ title: shareTitle, text: shareTitle })
    } catch {
      try { await navigator.clipboard.writeText(shareTitle) } catch {}
    }
  }, [])

  const handleCreatePlaylist = () => {
    if (!newName.trim()) return
    createPlaylist(newName.trim())
    setNewName('')
    setShowNewPlaylist(false)
  }

  return (
    <div className="min-h-full" style={{ animation: 'pageEnter 0.3s ease-out forwards' }}>
      <main className="pt-10 pb-8 px-5 max-w-3xl mx-auto">

        {/* ── Welcome + Quote ───────────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <h1 className="text-[48px] md:text-[60px] font-bold font-cursive leading-none select-none"
            style={{
              background: 'linear-gradient(135deg, #aed366, #c9f07e, #ffffff, #c9f07e, #aed366)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'gradientFlow 4s ease-in-out infinite',
            }}
          >
            Welcome
          </h1>
          <p className="text-[15px] md:text-[17px] text-on-surface-variant/60 font-inter leading-relaxed max-w-lg mx-auto">
            {quote}
          </p>
        </div>

        {/* ── Separator ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-8">
          <span className="flex-1 h-[2px] rounded-full" style={{ background: 'linear-gradient(90deg, transparent, #aed366)' }} />
          <span className="w-[6px] h-[6px] rounded-full bg-primary-fixed-dim" />
          <span className="flex-1 h-[2px] rounded-full" style={{ background: 'linear-gradient(270deg, transparent, #aed366)' }} />
        </div>

        {/* ── Your Songs ───────────────────────────────────────────────── */}
        <div ref={sectionRef} className="mb-14">
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold font-syne flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #e2e3e0, #ffffff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              <span className="material-symbols-outlined text-primary-fixed-dim text-[22px]" style={{ fontVariationSettings: "'FILL' 1", WebkitTextFillColor: '#aed366' }}>library_music</span>
              Your Songs
              <span className="text-[13px] text-on-surface-variant/40 font-inter font-normal ml-1" style={{ WebkitTextFillColor: 'rgba(196,201,181,0.4)' }}>({library.length})</span>
            </h2>
            <div className="flex items-center gap-3">
              <input ref={fileInputRef} type="file" accept="audio/*,.mp3,.wav,.flac,.ogg,.aac,.m4a" onChange={onFileInputChange} className="hidden" multiple />
              <button onClick={openFilePicker} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-primary-fixed-dim font-medium transition-all hover:bg-primary-fixed-dim/15 active:scale-95">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
                Upload
              </button>
            </div>
          </div>

          {/* Section divider */}
          <div className="mb-5 mt-1" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(174,211,102,0.2), rgba(174,211,102,0.05), transparent)' }} />

          {library.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/20 mb-4">library_music</span>
              <p className="text-on-surface-variant/50 font-inter text-[15px]">No songs yet</p>
              <p className="text-on-surface-variant/30 font-inter text-[13px] mt-1">Upload your first track to get started</p>
            </div>
          )}

          {library.length > 0 && (
            <div className="space-y-px">
              {sorted.map((track, i) => {
                const isActive = currentTrack?.id === track.id
                const isMenuOpen = menuTrackId === track.id
                return (
                  <div
                    key={track.id}
                    className="group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer active:scale-[0.99] transition-all"
                    style={{
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(174,211,102,0.12), rgba(174,211,102,0.04))'
                        : 'transparent',
                      borderLeft: isActive ? '3px solid #aed366' : '3px solid transparent',
                      boxShadow: isActive ? '0 0 24px -8px rgba(174,211,102,0.15)' : 'none',
                      opacity: 1,
                      transform: 'translateY(0)',
                      transition: `opacity 0.4s ease-out ${i * 0.04}s, transform 0.4s ease-out ${i * 0.04}s, background 0.2s, box-shadow 0.2s`,
                    }}
                    onMouseOver={e => { if (!isActive) e.currentTarget.style.background = 'rgba(30,32,31,0.6)' }}
                    onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                    onClick={() => handlePlay(i)}
                  >
                    <span className="w-7 text-center text-[13px] text-on-surface-variant/50 font-mono flex-shrink-0 group-hover:hidden font-semibold">
                      {isActive ? (
                        <span className="material-symbols-outlined text-primary-fixed-dim text-[20px]" style={{ fontVariationSettings: "'FILL' 1", filter: 'drop-shadow(0 0 6px rgba(174,211,102,0.5))' }}>equalizer</span>
                      ) : i + 1}
                    </span>
                    <span className="w-7 text-center hidden group-hover:flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px] text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1", filter: 'drop-shadow(0 0 6px rgba(174,211,102,0.4))' }}>play_arrow</span>
                    </span>

                    <img src={track.cover || DEFAULT_COVER} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0 bg-surface-variant ring-1 ring-white/5 group-hover:ring-primary-fixed-dim/20 transition-all" onError={e => { if (e.target.src !== DEFAULT_COVER) e.target.src = DEFAULT_COVER }} />

                    <div className="flex-grow min-w-0">
                      <p className="text-[16px] font-semibold truncate font-inter" style={{ color: isActive ? '#c9f07e' : '#ffffff' }}>
                        {track.title || 'Unknown Track'}
                      </p>
                      <p className="text-[13px] text-on-surface-variant/70 truncate font-inter">{track.artist || 'Unknown Artist'}</p>
                    </div>

                    <span className="text-[13px] text-on-surface-variant/50 font-mono flex-shrink-0 w-11 text-right font-medium">
                      {track.duration ? `${Math.floor(track.duration / 60)}:${String(Math.floor(track.duration % 60)).padStart(2, '0')}` : '--:--'}
                    </span>

                    {/* Track three-dot */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); setMenuTrackId(isMenuOpen ? null : track.id) }}
                        className="w-9 h-9 flex items-center justify-center rounded-lg transition-all text-on-surface-variant/40"
                        style={{ background: isMenuOpen ? 'rgba(174,211,102,0.1)' : 'transparent' }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(174,211,102,0.08)'; e.currentTarget.style.color = '#c9f07e' }}
                        onMouseOut={e => { if (!isMenuOpen) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '' } }}
                      >
                        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>more_vert</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Playlists Section ─────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-[20px] font-bold font-syne flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #e2e3e0, #ffffff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              <span className="material-symbols-outlined text-[22px]" style={{ color: '#aed366', fontVariationSettings: "'FILL' 1", WebkitTextFillColor: '#aed366' }}>queue_music</span>
              Playlists
              <span className="text-[13px] font-normal font-inter" style={{ WebkitTextFillColor: 'rgba(196,201,181,0.4)' }}>({playlists.length})</span>
            </h2>
            <button
              onClick={() => setShowNewPlaylist(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] text-primary-fixed-dim font-medium transition-all hover:bg-primary-fixed-dim/15 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
              Create
            </button>
          </div>

          {/* Section divider */}
          <div className="mb-5 mt-1" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(174,211,102,0.2), rgba(174,211,102,0.05), transparent)' }} />

          {/* Create playlist modal */}
          {showNewPlaylist && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => { setShowNewPlaylist(false); setNewName('') }}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div
                className="relative w-[320px] p-0 rounded-3xl overflow-hidden shadow-2xl"
                style={{ background: 'rgba(30, 32, 31, 0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(68, 73, 57, 0.25)' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #aed366, #c9f07e, #aed366)' }} />

                <div className="p-6">
                  <h3 className="text-[18px] font-bold font-syne text-[#e2e3e0] text-center mb-1">New Playlist</h3>
                  <p className="text-[12px] text-[#c4c9b5]/50 font-inter text-center mb-5">Give your playlist a name</p>

                  <input
                    autoFocus
                    type="text"
                    placeholder="My playlist..."
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreatePlaylist(); if (e.key === 'Escape') setShowNewPlaylist(false) }}
                    className="w-full text-[#e2e3e0] text-[16px] font-inter px-4 py-3 rounded-xl outline-none placeholder:text-[#c4c9b5]/30 mb-5"
                    style={{ background: 'rgba(18, 20, 19, 0.6)', border: '1px solid rgba(68, 73, 57, 0.3)' }}
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => { setShowNewPlaylist(false); setNewName('') }}
                      className="flex-1 py-3 rounded-xl text-[13px] font-medium text-[#c4c9b5]/60 font-inter active:scale-95 transition-all hover:bg-white/5 hover:text-[#c4c9b5]/90"
                      style={{ border: '1px solid rgba(68, 73, 57, 0.2)' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePlaylist}
                      className="flex-1 py-3 rounded-xl text-[13px] font-semibold text-[#141f00] font-inter active:scale-95 transition-all hover:brightness-110 hover:shadow-lg hover:shadow-[#aed366]/20"
                      style={{ background: 'linear-gradient(135deg, #aed366, #c9f07e)' }}
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {playlists.length === 0 && (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/20 mb-3">queue_music</span>
              <p className="text-on-surface-variant/50 font-inter text-[14px]">No playlists yet</p>
              <p className="text-on-surface-variant/30 font-inter text-[12px] mt-1">Create your first playlist</p>
            </div>
          )}

          {playlists.length > 0 && (
            <div className="space-y-2">
              {playlists.map(playlist => {
                const isMenuOpen = playlistMenuId === playlist.id
                return (
                  <div key={playlist.id}
                    className="group flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer active:scale-[0.98] transition-all"
                    style={{
                      background: 'rgba(26,28,27,0.4)',
                      border: '1px solid rgba(68,73,57,0.15)',
                    }}
                    onClick={() => { setActivePlaylist(playlist.id); setActiveView('playlist') }}
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-surface-variant flex items-center justify-center">
                      {playlist.cover ? (
                        <img src={playlist.cover} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-on-surface-variant/30 text-[22px]">queue_music</span>
                      )}
                    </div>

                    <div className="flex-grow min-w-0">
                      <p className="text-[14px] font-semibold truncate font-syne text-on-surface">{playlist.name}</p>
                      <p className="text-[11px] text-on-surface-variant/50 font-inter">{playlist.tracks?.length || 0} tracks</p>
                    </div>

                    {/* Playlist three-dot */}
                    <div className="relative flex-shrink-0">
                      <button
                        onClick={e => { e.stopPropagation(); setPlaylistMenuId(isMenuOpen ? null : playlist.id) }}
                        className="w-8 h-8 flex items-center justify-center text-on-surface-variant/40 hover:text-on-surface transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">more_vert</span>
                      </button>

                      {isMenuOpen && (
                        <>
                          <div className="fixed inset-0 z-[99]" onClick={() => setPlaylistMenuId(null)} />
                          <div className="absolute right-0 top-full mt-1 z-[100] min-w-[180px] rounded-2xl py-2 shadow-2xl"
                            style={{ background: 'rgba(25, 27, 25, 0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(68, 73, 57, 0.25)' }}
                          >
                            <button
                              onClick={e => { e.stopPropagation(); deletePlaylist(playlist.id); setPlaylistMenuId(null) }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-error hover:bg-white/5 transition-colors font-inter"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Liked Songs ──────────────────────────────────────────────────── */}
        {likedTracks.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[20px] font-bold font-syne flex items-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #e2e3e0, #ffffff)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                <span className="material-symbols-outlined text-[22px]" style={{ color: '#aed366', fontVariationSettings: "'FILL' 1", WebkitTextFillColor: '#aed366' }}>favorite</span>
                Liked Songs
                <span className="text-[13px] font-normal font-inter" style={{ WebkitTextFillColor: 'rgba(196,201,181,0.4)' }}>({likedTracks.length})</span>
              </h2>
            </div>
            <div className="space-y-px">
              {likedTracks.slice(0, 5).map((track, i) => (
                <div key={track.id}
                  className="group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer active:scale-[0.99] transition-all"
                  style={{
                    borderLeft: '3px solid rgba(174,211,102,0.15)',
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(30,32,31,0.6)'}
                  onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => { setQueue(likedTracks, i); setPlayerExpanded(true) }}
                >
                  <img src={track.cover || DEFAULT_COVER} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0 bg-surface-variant ring-1 ring-white/5 group-hover:ring-primary-fixed-dim/20 transition-all" onError={e => { if (e.target.src !== DEFAULT_COVER) e.target.src = DEFAULT_COVER }} />
                  <div className="flex-grow min-w-0">
                    <p className="text-[16px] font-semibold truncate font-inter text-[#ffffff]">{track.title || 'Unknown Track'}</p>
                    <p className="text-[13px] text-on-surface-variant/70 truncate font-inter">{track.artist || 'Unknown Artist'}</p>
                  </div>
                  <span className="material-symbols-outlined text-[18px] flex-shrink-0" style={{ color: '#aed366', fontVariationSettings: "'FILL' 1", filter: 'drop-shadow(0 0 6px rgba(174,211,102,0.4))' }}>favorite</span>
                </div>
              ))}
              {likedTracks.length > 5 && (
                <button
                  onClick={() => { setQueue(likedTracks, 0); setPlayerExpanded(true) }}
                  className="w-full text-left px-3 py-3 text-[13px] font-semibold font-inter transition-all rounded-xl"
                  style={{ color: '#aed366' }}
                  onMouseOver={e => { e.currentTarget.style.background = 'rgba(174,211,102,0.08)'; e.currentTarget.style.color = '#c9f07e' }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#aed366' }}
                >
                  Show all {likedTracks.length} liked songs →
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Add to Playlist picker ────────────────────────────────────────── */}
        {addToPlaylistTrackId && (() => {
          const track = library.find(t => t.id === addToPlaylistTrackId)
          if (!track) return null
          return (
            <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center" onClick={() => setAddToPlaylistTrackId(null)}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div
                className="relative w-full sm:max-w-sm max-h-[55vh] rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: 'rgba(30, 32, 31, 0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(68, 73, 57, 0.25)' }}
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(68, 73, 57, 0.2)' }}>
                  <img src={track.cover || DEFAULT_COVER} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-surface-variant" onError={e => { if (e.target.src !== DEFAULT_COVER) e.target.src = DEFAULT_COVER }} />
                  <div className="flex-grow min-w-0">
                    <p className="text-[14px] font-medium truncate font-inter text-[#e2e3e0]">{track.title || 'Unknown'}</p>
                    <p className="text-[11px] text-[#c4c9b5]/50 truncate font-inter">{track.artist || 'Unknown Artist'}</p>
                  </div>
                  <button onClick={() => setAddToPlaylistTrackId(null)} className="text-[#c4c9b5]/40 active:scale-90 flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>
                <div className="overflow-y-auto max-h-[calc(55vh-68px)]">
                  {playlists.map(pl => {
                    const alreadyIn = pl.tracks.some(t => t.id === track.id)
                    return (
                      <button
                        key={pl.id}
                        disabled={alreadyIn}
                        onClick={() => { addTrackToPlaylist(pl.id, track); setAddToPlaylistTrackId(null) }}
                        className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-left"
                      >
                        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-[#333534] flex items-center justify-center">
                          {pl.cover ? (
                            <img src={pl.cover} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="material-symbols-outlined text-[#c4c9b5]/30 text-[18px]">queue_music</span>
                          )}
                        </div>
                        <div className="flex-grow min-w-0">
                          <p className="text-[13px] font-medium truncate font-inter text-[#e2e3e0]">{pl.name}</p>
                          <p className="text-[10px] text-[#c4c9b5]/50 font-inter">{pl.tracks.length} tracks</p>
                        </div>
                        {alreadyIn ? (
                          <span className="material-symbols-outlined text-[16px] text-[#aed366] flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                        ) : (
                          <span className="material-symbols-outlined text-[16px] text-[#c4c9b5]/40 flex-shrink-0">add</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })()}

        {/* ── Track Action Sheet ─────────────────────────────────────────── */}
        {menuTrackId && (() => {
          const track = library.find(t => t.id === menuTrackId)
          if (!track) return null
          return (
            <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center" onClick={() => setMenuTrackId(null)}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div
                className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl"
                style={{ background: 'rgba(30, 32, 31, 0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(68, 73, 57, 0.25)' }}
                onClick={e => e.stopPropagation()}
              >
                {/* Track info header */}
                <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(68, 73, 57, 0.2)' }}>
                  <img src={track.cover || DEFAULT_COVER} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-surface-variant" onError={e => { if (e.target.src !== DEFAULT_COVER) e.target.src = DEFAULT_COVER }} />
                  <div className="flex-grow min-w-0">
                    <p className="text-[14px] font-medium truncate font-inter text-[#e2e3e0]">{track.title || 'Unknown'}</p>
                    <p className="text-[11px] text-[#c4c9b5]/50 truncate font-inter">{track.artist || 'Unknown Artist'}</p>
                  </div>
                  <button onClick={() => setMenuTrackId(null)} className="text-[#c4c9b5]/40 active:scale-90 flex-shrink-0">
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {/* Action buttons */}
                <div className="py-2">
                  <button onClick={() => { toggleLike(track.id); setMenuTrackId(null) }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[20px]" style={{ color: track.liked ? '#aed366' : 'rgba(226,227,224,0.8)', fontVariationSettings: track.liked ? "'FILL' 1" : "'FILL' 0'", animation: track.liked ? 'likedPop 0.35s ease-out' : 'none' }}>favorite</span>
                    <span className="text-[14px] font-inter text-[#e2e3e0]">{track.liked ? 'Liked' : 'Like'}</span>
                  </button>
                  <button onClick={() => { handleShare(track); setMenuTrackId(null) }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[20px] text-[#e2e3e0]/80">share</span>
                    <span className="text-[14px] font-inter text-[#e2e3e0]">Share</span>
                  </button>
                  {playlists.length > 0 && (
                    <button onClick={() => { setMenuTrackId(null); setAddToPlaylistTrackId(track.id) }}
                      className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-[20px] text-[#e2e3e0]/80">playlist_add</span>
                      <span className="text-[14px] font-inter text-[#e2e3e0]">Add to Playlist</span>
                    </button>
                  )}
                  <div className="mx-5 my-1 h-px" style={{ background: 'rgba(68, 73, 57, 0.25)' }} />
                  <button onClick={() => { deleteTrack(track.id); setMenuTrackId(null) }}
                    className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left"
                  >
                    <span className="material-symbols-outlined text-[20px] text-error">delete</span>
                    <span className="text-[14px] font-inter text-error">Delete</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

      </main>
    </div>
  )
}
