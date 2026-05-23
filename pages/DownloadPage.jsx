import React, { useMemo, useState, useCallback } from 'react'
import usePlayerStore from '../store/playerStore'
import { formatTime, DEFAULT_COVER } from '../utils/audioUtils'
import useOnlineStatus from '../hooks/useOnlineStatus'

export default function DownloadPage() {
  const library = usePlayerStore(s => s.library)
  const currentTrack = usePlayerStore(s => s.currentTrack)
  const isPlaying = usePlayerStore(s => s.isPlaying)
  const setQueue = usePlayerStore(s => s.setQueue)
  const setPlayerExpanded = usePlayerStore(s => s.setPlayerExpanded)
  const deleteTrack = usePlayerStore(s => s.deleteTrack)
  const toggleLike = usePlayerStore(s => s.toggleLike)
  const addTrackToPlaylist = usePlayerStore(s => s.addTrackToPlaylist)

  const downloads = useMemo(() => library.filter(t => t._isDownloaded), [library])
  const playlists = usePlayerStore(s => s.playlists)
  const [menuTrackId, setMenuTrackId] = useState(null)
  const [addToPlaylistTrackId, setAddToPlaylistTrackId] = useState(null)
  const isOnline = useOnlineStatus()

  const handlePlay = (index) => {
    setQueue(downloads, index)
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

  return (
    <>
      <div style={{ animation: 'pageEnter 0.3s ease-out forwards' }}>
        <div className="max-w-3xl mx-auto px-5 pt-6">

          {/* Offline banner */}
          {!isOnline && (
            <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl" style={{ background: 'rgba(242, 139, 130, 0.1)', border: '1px solid rgba(242, 139, 130, 0.2)' }}>
              <span className="material-symbols-outlined text-[20px] text-error" style={{ fontVariationSettings: "'FILL' 1" }}>wifi_off</span>
              <div>
                <p className="text-[13px] font-medium font-inter text-error">You are offline</p>
                <p className="text-[11px] font-inter text-error/70">Downloaded songs are available for playback</p>
              </div>
            </div>
          )}

          {/* Empty state */}
          {downloads.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="material-symbols-outlined text-[56px] text-on-surface-variant/20 mb-4" style={{ fontVariationSettings: "'FILL' 1" }}>cloud_download</span>
              <p className="text-on-surface-variant/50 font-inter text-[15px]">No downloads yet</p>
              <p className="text-on-surface-variant/30 font-inter text-[13px] mt-1">Download songs from JioSaavn to listen offline</p>
            </div>
          )}

          {/* Download list */}
          {downloads.length > 0 && (
            <div className="space-y-1">
              {downloads.map((track, i) => {
                const isActive = currentTrack?.id === track.id
                const isCurrentPlaying = isActive && isPlaying
                return (
                  <div
                    key={track.id}
                    className="group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:bg-surface-container active:scale-[0.98]"
                    onClick={() => handlePlay(i)}
                    onMouseOver={e => { if (!isActive) e.currentTarget.style.background = 'rgba(30,32,31,0.6)' }}
                    onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
                  >
                    {/* Playing indicator / number */}
                    <span className="w-7 text-center text-[13px] text-on-surface-variant/50 font-mono flex-shrink-0 group-hover:hidden font-semibold">
                      {isCurrentPlaying ? (
                        <span className="material-symbols-outlined text-primary-fixed-dim text-[20px]" style={{ fontVariationSettings: "'FILL' 1", filter: 'drop-shadow(0 0 6px rgba(174,211,102,0.5))' }}>equalizer</span>
                      ) : i + 1}
                    </span>
                    <span className="w-7 text-center hidden group-hover:flex items-center justify-center flex-shrink-0">
                      <span className="material-symbols-outlined text-[20px] text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1", filter: 'drop-shadow(0 0 6px rgba(174,211,102,0.4))' }}>play_arrow</span>
                    </span>

                    {/* Album art */}
                    <img src={track.cover || DEFAULT_COVER} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0 bg-surface-variant ring-1 ring-white/5 group-hover:ring-primary-fixed-dim/20 transition-all" onError={e => { if (e.target.src !== DEFAULT_COVER) e.target.src = DEFAULT_COVER }} />

                    {/* Info */}
                    <div className="flex-grow min-w-0">
                      <p className="text-[15px] font-semibold truncate font-syne leading-tight" style={{ color: isActive ? '#c9f07e' : '#e2e3e0' }}>
                        {track.title}
                      </p>
                      <p className="text-[12px] text-on-surface-variant/60 truncate font-inter">{track.artist}</p>
                    </div>

                    {/* Duration / three-dot */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[12px] text-on-surface-variant/40 font-inter tabular-nums">
                        {formatTime(track.duration)}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); setMenuTrackId(menuTrackId === track.id ? null : track.id) }}
                        className="w-9 h-9 flex items-center justify-center rounded-lg transition-all text-on-surface-variant/40"
                        style={{ background: menuTrackId === track.id ? 'rgba(174,211,102,0.1)' : 'transparent' }}
                        onMouseOver={e => { e.currentTarget.style.background = 'rgba(174,211,102,0.08)'; e.currentTarget.style.color = '#c9f07e' }}
                        onMouseOut={e => { if (menuTrackId !== track.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '' } }}
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
      </div>

      {/* ── Track menu centered overlay ── */}
      {menuTrackId && (() => {
        const track = downloads.find(t => t.id === menuTrackId)
        if (!track) return null
        return (
          <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setMenuTrackId(null)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
              className="relative w-full max-w-xs mx-auto rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: 'rgba(30, 32, 31, 0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(68, 73, 57, 0.25)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Track info header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(68, 73, 57, 0.2)' }}>
                <img src={track.cover || DEFAULT_COVER} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-surface-variant" onError={e => { if (e.target.src !== DEFAULT_COVER) e.target.src = DEFAULT_COVER }} />
                <div className="flex-grow min-w-0">
                  <p className="text-[14px] font-medium truncate font-inter text-[#e2e3e0]">{track.title}</p>
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

      {/* ── Add to Playlist picker ── */}
      {addToPlaylistTrackId && (() => {
        const track = downloads.find(t => t.id === addToPlaylistTrackId)
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
    </>
  )
}
