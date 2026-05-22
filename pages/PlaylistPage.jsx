// PlaylistPage.jsx — Matches playlist.html with real track data
import React, { useState, useEffect } from 'react'
import usePlayerStore from '../store/playerStore'
import { formatTime, DEFAULT_COVER } from '../utils/audioUtils'

export default function PlaylistPage() {
  const {
    playlists, activePlaylistId, currentTrack, isPlaying,
    setActiveView, setPlayerExpanded,
    playPlaylist, playTrackFromQueue, setQueue,
    toggleLike, deleteTrack, removeTrackFromPlaylist,
    library,
  } = usePlayerStore()

  const [sortBy, setSortBy] = useState('default')
  const [showMenu, setShowMenu] = useState(null)

  const handleShare = async (track) => {
    if (!track?.src) return
    const shareTitle = `${track.title} - VDK`
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
      try {
        await navigator.clipboard.writeText(shareTitle)
      } catch {}
    }
  }

  // Close menu on click outside
  useEffect(() => {
    if (!showMenu) return
    const handler = (e) => {
      if (!e.target.closest('[data-menu="track"]')) {
        setShowMenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showMenu])

  const handleRemove = (trackId) => {
    if (playlist.id === '__all__' || playlist.isSystem) {
      deleteTrack(trackId)
    } else {
      removeTrackFromPlaylist(playlist.id, trackId)
    }
    setShowMenu(null)
  }

  // Get the active playlist (or fallback to all songs)
  const playlist = activePlaylistId === '__all__'
    ? { id: '__all__', name: 'All Songs', tracks: library, cover: library[0]?.cover }
    : playlists.find(p => p.id === activePlaylistId)

  if (!playlist) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 mb-3 block">queue_music</span>
          <p className="text-on-surface-variant/60 font-inter">No playlist selected</p>
          <button className="mt-4 text-primary-fixed-dim font-semibold" onClick={() => setActiveView('home')}>
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const tracks = playlist.tracks || []
  const cover = playlist.cover || tracks[0]?.cover || DEFAULT_COVER
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)

  const handlePlayAll = () => {
    if (!tracks.length) return
    setQueue(tracks, 0)
    setPlayerExpanded(true)
  }

  const handlePlayTrack = (index) => {
    setQueue(tracks, index)
    setPlayerExpanded(true)
  }

  return (
    <div style={{ animation: 'pageEnter 0.3s ease-out forwards' }}>

      <main className="pt-6 pb-6 px-5 md:px-16 min-h-full">

        {/* Playlist Header */}
        <section className="mt-8 mb-10 flex flex-col md:flex-row gap-8 items-end">
          {/* Cover art */}
          <div className="w-full md:w-64 aspect-square rounded-xl overflow-hidden shadow-2xl relative group flex-shrink-0">
            <img
              src={cover}
              alt={playlist.name}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={e => { if (e.target.src !== DEFAULT_COVER) e.target.src = DEFAULT_COVER }}
            />
            <div
              className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: 'rgba(0,0,0,0.4)' }}
            >
              <button
                className="w-20 h-20 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform active:scale-95"
                onClick={handlePlayAll}
              >
                <span className="material-symbols-outlined text-[48px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <span className="text-[12px] text-primary-fixed-dim uppercase tracking-widest font-inter">
              {playlist.isSystem ? 'Your Library' : 'Playlist'}
            </span>
            <h2 className="text-[32px] md:text-[40px] font-bold text-on-surface font-syne leading-tight">
              {playlist.name}
            </h2>
            <p className="text-on-surface-variant text-[16px] font-inter">
              {tracks.length} tracks • {formatTime(totalDuration)}
            </p>
            <div className="flex items-center gap-4 pt-2 flex-wrap">
              <button
                className="px-10 py-4 rounded-full bg-primary-fixed text-on-primary-fixed font-semibold text-[13px] uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-lg"
                onClick={handlePlayAll}
              >
                Play All
              </button>
              <button className="w-14 h-14 rounded-full border border-outline flex items-center justify-center text-on-surface hover:border-primary-fixed hover:text-primary-fixed transition-colors">
                <span className="material-symbols-outlined text-[22px]">shuffle</span>
              </button>
            </div>
          </div>
        </section>

        {/* Track List */}
        {tracks.length === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant/20 mb-3 block">music_note</span>
            <p className="text-on-surface-variant/50 font-inter">No tracks in this playlist</p>
            <button className="mt-3 text-primary-fixed-dim text-[14px] font-semibold" onClick={() => setActiveView('upload')}>
              Upload music
            </button>
          </div>
        ) : (
          <section className="space-y-1">
            {/* Column headers (desktop) */}
            <div className="hidden md:grid grid-cols-[1fr_180px_80px_64px] px-8 py-3 border-b border-outline-variant/10 text-on-surface-variant text-[11px] uppercase tracking-widest font-inter">
              <span>Title</span>
              <span>Artist</span>
              <span className="text-right">Time</span>
              <span />
            </div>

            {tracks.map((track, index) => {
              const isCurrentTrack = currentTrack?.id === track.id
              const isCurrentPlaying = isCurrentTrack && isPlaying

              return (
                <div
                  key={track.id}
                  className="group relative flex items-center justify-between p-4 md:p-6 rounded-xl cursor-pointer transition-all duration-300"
                  style={{
                    background: isCurrentTrack ? 'rgba(40,42,41,1)' : 'transparent',
                    borderLeft: isCurrentTrack ? '4px solid #aed366' : '4px solid transparent',
                    boxShadow: isCurrentTrack ? '-16px 0 32px -12px rgba(201,240,126,0.15)' : 'none',
                  }}
                  onMouseOver={e => !isCurrentTrack && (e.currentTarget.style.background = 'rgba(30,32,31,0.6)')}
                  onMouseOut={e => !isCurrentTrack && (e.currentTarget.style.background = 'transparent')}
                  onClick={() => handlePlayTrack(index)}
                >
                  {/* Track # / Play / Equalizer */}
                  <div className="flex items-center gap-5 flex-1 overflow-hidden">
                    <div className="w-5 flex-shrink-0 text-center">
                      {isCurrentPlaying ? (
                        <span className="material-symbols-outlined text-primary-fixed-dim text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>equalizer</span>
                      ) : (
                        <>
                          <span className="text-[12px] text-on-surface-variant/40 font-inter group-hover:hidden">{index + 1}</span>
                          <span className="material-symbols-outlined text-primary-fixed-dim text-[20px] hidden group-hover:block" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                        </>
                      )}
                    </div>

                    {/* Title + Artist (mobile) */}
                    <div className="flex flex-col overflow-hidden">
                      <span
                        className="text-[16px] font-semibold truncate font-syne leading-tight transition-colors"
                        style={{ color: isCurrentTrack ? '#aed366' : '#e2e3e0' }}
                      >
                        {track.title}
                      </span>
                      <span className="text-[13px] text-on-surface-variant md:hidden font-inter truncate">
                        {track.artist}
                      </span>
                    </div>
                  </div>

                  {/* Artist (desktop) */}
                  <div className="hidden md:block w-[180px] text-[15px] text-on-surface-variant font-inter truncate flex-shrink-0">
                    {track.artist}
                  </div>

                  {/* Duration + Actions */}
                  <div
                    className="flex items-center gap-4 ml-2"
                    onClick={e => e.stopPropagation()}
                  >
                    <span className="text-[13px] text-on-surface-variant font-inter tabular-nums">
                      {formatTime(track.duration)}
                    </span>
                    <button
                      className="w-10 h-10 flex items-center justify-center active:scale-90 transition-all opacity-0 group-hover:opacity-100"
                      onClick={() => toggleLike(track.id)}
                    >
                      <span
                        className="material-symbols-outlined text-[20px]"
                        style={{
                          color: track.liked ? '#aed366' : 'rgba(196,201,181,0.5)',
                          fontVariationSettings: track.liked ? "'FILL' 1" : "'FILL' 0",
                        }}
                      >
                        favorite
                      </span>
                    </button>
                    <div className="relative">
                      <button
                        className="w-10 h-10 flex items-center justify-center text-on-surface-variant/50 hover:text-on-surface transition-colors opacity-0 group-hover:opacity-100 active:scale-90"
                        onClick={() => setShowMenu(showMenu === track.id ? null : track.id)}
                      >
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>

                      {showMenu === track.id && (
                        <div
                          data-menu="track"
                          className="absolute right-0 bottom-full mb-2 z-[100] min-w-[200px] rounded-2xl py-2 shadow-2xl"
                          style={{
                            background: 'rgba(25, 27, 25, 0.98)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(68, 73, 57, 0.25)',
                          }}
                        >
                          <button
                            className="flex items-center gap-3 w-full px-5 py-3.5 text-[14px] text-on-surface hover:bg-white/[0.06] active:scale-[0.98] transition-all rounded-none first:rounded-t-2xl"
                            onClick={() => { toggleLike(track.id); setShowMenu(null) }}
                          >
                            <span className="material-symbols-outlined text-[20px]" style={{ color: track.liked ? '#aed366' : 'rgba(196,201,181,0.5)' }}>
                              {track.liked ? 'favorite' : 'favorite'}
                            </span>
                            <span className="font-medium">{track.liked ? 'Liked' : 'Like'}</span>
                          </button>
                          <button
                            className="flex items-center gap-3 w-full px-5 py-3.5 text-[14px] text-on-surface hover:bg-white/[0.06] active:scale-[0.98] transition-all"
                            onClick={() => { setShowMenu(null); handleShare(track) }}
                          >
                            <span className="material-symbols-outlined text-[20px] text-on-surface-variant/70">share</span>
                            <span className="font-medium">Share</span>
                          </button>
                          <div className="h-px mx-5" style={{ background: 'rgba(68, 73, 57, 0.2)' }} />
                          <button
                            className="flex items-center gap-3 w-full px-5 py-3.5 text-[14px] text-red-400/80 hover:bg-white/[0.06] active:scale-[0.98] transition-all rounded-none last:rounded-b-2xl"
                            onClick={() => handleRemove(track.id)}
                          >
                            <span className="material-symbols-outlined text-[20px] text-red-400/60">remove_circle</span>
                            <span className="font-medium">{playlist.id === '__all__' || playlist.isSystem ? 'Delete from library' : 'Remove from playlist'}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </section>
        )}
      </main>
    </div>
  )
}
