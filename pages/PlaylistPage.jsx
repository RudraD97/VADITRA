// PlaylistPage.jsx — Swipeable music card view for playlists
import React, { useState, useEffect, useRef } from 'react'
import usePlayerStore from '../store/playerStore'
import { formatTime, DEFAULT_COVER } from '../utils/audioUtils'

const SWIPE_THRESHOLD = 60

export default function PlaylistPage() {
  const {
    playlists, activePlaylistId, currentTrack, isPlaying,
    setActiveView, setPlayerExpanded, goHome,
    playPlaylist, playTrackFromQueue, setQueue,
    toggleLike, deleteTrack, removeTrackFromPlaylist,
    library,
  } = usePlayerStore()

  const [cardIndex, setCardIndex] = useState(0)
  const [swipeX, setSwipeX] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [transition, setTransition] = useState(false)

  const cardTouchRef = useRef({ startX: 0, currentX: 0, isSwiping: false })
  const cardAnimTimer = useRef(null)

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

  const handleRemove = (trackId) => {
    if (playlist.id === '__all__' || playlist.isSystem) {
      deleteTrack(trackId)
    } else {
      removeTrackFromPlaylist(playlist.id, trackId)
    }
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
          <button className="mt-4 text-primary-fixed-dim font-semibold" onClick={() => goHome()}>
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const tracks = playlist.tracks || []
  const cover = playlist.cover || tracks[0]?.cover || DEFAULT_COVER
  const totalDuration = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)

  const track = tracks[cardIndex]
  const total = tracks.length

  const handlePlayAll = () => {
    if (!tracks.length) return
    setQueue(tracks, 0)
    setPlayerExpanded(true)
  }

  const handlePlayTrack = (index) => {
    setQueue(tracks, index)
    setPlayerExpanded(true)
  }

  // Reset card index when playlist changes
  useEffect(() => {
    setCardIndex(0)
    setSwipeX(0)
    setTransition(false)
    setIsSwiping(false)
  }, [activePlaylistId])

  // Clamp cardIndex when tracks shrink (e.g. after removal)
  useEffect(() => {
    if (total > 0 && cardIndex >= total) {
      setCardIndex(total - 1)
    }
  }, [total, cardIndex])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(cardAnimTimer.current)
  }, [])

  // Touch handlers for swipeable card
  const handleTouchStart = (e) => {
    if (transition || total < 2) return
    const touch = e.touches[0]
    cardTouchRef.current = { startX: touch.clientX, currentX: touch.clientX, isSwiping: true }
    clearTimeout(cardAnimTimer.current)
    setIsSwiping(true)
    setSwipeX(0)
  }

  const handleTouchMove = (e) => {
    if (!cardTouchRef.current.isSwiping || transition) return
    const touch = e.touches[0]
    cardTouchRef.current.currentX = touch.clientX
    let delta = touch.clientX - cardTouchRef.current.startX
    // Resistance at edges (only relevant for first/last without wrap)
    // With wrapping, we don't need resistance — let it swipe freely
    setSwipeX(delta)
  }

  const handleTouchEnd = () => {
    if (!cardTouchRef.current.isSwiping || transition) return
    cardTouchRef.current.isSwiping = false
    const delta = cardTouchRef.current.currentX - cardTouchRef.current.startX

    if (Math.abs(delta) > SWIPE_THRESHOLD) {
      const direction = delta > 0 ? -1 : 1
      let nextIndex = cardIndex + direction
      // Wrap around
      if (nextIndex < 0) nextIndex = total - 1
      if (nextIndex >= total) nextIndex = 0

      // Animate exit
      setTransition(true)
      setSwipeX(direction * (window.innerWidth + 100))

      cardAnimTimer.current = setTimeout(() => {
        setCardIndex(nextIndex)
        setSwipeX(0)
        setTransition(false)
        setIsSwiping(false)
      }, 200)
    } else {
      // Snap back
      setSwipeX(0)
      setIsSwiping(false)
    }
  }

  const goToTrack = (index) => {
    if (transition || index === cardIndex) return
    const direction = index > cardIndex ? -1 : 1
    setTransition(true)
    setSwipeX(direction * (window.innerWidth + 100))
    cardAnimTimer.current = setTimeout(() => {
      setCardIndex(index)
      setSwipeX(0)
      setTransition(false)
    }, 200)
  }

  const isCurrentTrack = track?.id === currentTrack?.id
  const isCurrentPlaying = isCurrentTrack && isPlaying

  return (
    <div style={{ animation: 'pageEnter 0.3s ease-out forwards' }}>
      <main className="pt-6 pb-6 px-5 md:px-16 min-h-full">

        {/* Playlist Header */}
        <section className="mt-8 mb-8 flex flex-col md:flex-row gap-8 items-end">
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

          <div className="flex-1 space-y-4">
            <span className="text-[12px] text-primary-fixed-dim uppercase tracking-widest font-inter">
              {playlist.isSystem ? 'Your Library' : 'Playlist'}
            </span>
            <h2 className="text-[32px] md:text-[40px] font-bold text-on-surface font-syne leading-tight">
              {playlist.name}
            </h2>
            <p className="text-on-surface-variant text-[16px] font-inter">
              {total} tracks • {formatTime(totalDuration)}
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

        {/* Swipeable Card Section */}
        {total === 0 ? (
          <div className="py-16 text-center">
            <span className="material-symbols-outlined text-[40px] text-on-surface-variant/20 mb-3 block">music_note</span>
            <p className="text-on-surface-variant/50 font-inter">No tracks in this playlist</p>
            <button className="mt-3 text-primary-fixed-dim text-[14px] font-semibold" onClick={() => setActiveView('upload')}>
              Upload music
            </button>
          </div>
        ) : (
          <>
            <div
              className="relative w-full max-w-[420px] mx-auto select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* Card */}
              <div
                className="aspect-square rounded-2xl overflow-hidden relative cursor-pointer"
                style={{
                  transform: isSwiping || transition ? `translateX(${swipeX}px)` : 'none',
                  transition: isSwiping || transition ? 'none' : 'transform 0.3s ease-out',
                }}
                onClick={() => handlePlayTrack(cardIndex)}
              >
                <img
                  src={track?.cover || DEFAULT_COVER}
                  alt={track?.title || ''}
                  className="w-full h-full object-cover"
                  onError={e => { if (e.target.src !== DEFAULT_COVER) e.target.src = DEFAULT_COVER }}
                />

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Track info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-5 pb-6">
                  <h3 className="text-[18px] font-bold text-primary-fixed-dim font-syne truncate leading-tight">
                    {track?.title}
                  </h3>
                  <p className="text-[13px] text-on-surface-variant font-inter mt-1 truncate">
                    {track?.artist} · {formatTime(track?.duration)}
                  </p>
                </div>

                {/* Play indicator top-right */}
                <div className="absolute top-4 right-4">
                  {isCurrentPlaying ? (
                    <span className="material-symbols-outlined text-primary-fixed-dim text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                      equalizer
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-white/70 text-[22px]">
                      play_circle
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dots indicator */}
            {total > 1 && (
              <div className="flex items-center justify-center gap-2 mt-5">
                {tracks.map((_, i) => (
                  <button
                    key={i}
                    className="rounded-full transition-all active:scale-90"
                    style={{
                      width: i === cardIndex ? 24 : 8,
                      height: 8,
                      background: i === cardIndex ? '#aed366' : 'rgba(196,201,181,0.25)',
                    }}
                    onClick={() => goToTrack(i)}
                  />
                ))}
              </div>
            )}

            {/* Action row */}
            {track && (
              <div className="flex items-center justify-center gap-8 mt-6">
                <button
                  className="flex flex-col items-center gap-1 text-on-surface-variant/50 active:scale-90 transition-all"
                  onClick={() => toggleLike(track.id)}
                >
                  <span
                    className="material-symbols-outlined text-[22px]"
                    style={{
                      fontVariationSettings: track.liked ? "'FILL' 1" : "'FILL' 0",
                      color: track.liked ? '#aed366' : 'rgba(196,201,181,0.5)',
                    }}
                  >
                    favorite
                  </span>
                  <span className="text-[10px] font-inter">{track.liked ? 'Liked' : 'Like'}</span>
                </button>

                <button
                  className="w-14 h-14 rounded-full bg-primary-fixed text-on-primary-fixed flex items-center justify-center active:scale-90 transition-all shadow-lg"
                  onClick={() => handlePlayTrack(cardIndex)}
                >
                  <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                </button>

                <button
                  className="flex flex-col items-center gap-1 text-on-surface-variant/50 active:scale-90 transition-all"
                  onClick={() => handleShare(track)}
                >
                  <span className="material-symbols-outlined text-[22px]">share</span>
                  <span className="text-[10px] font-inter">Share</span>
                </button>
              </div>
            )}

            {/* Remove button */}
            {track && (
              <div className="text-center mt-4">
                <button
                  className="text-[12px] text-red-400/60 hover:text-red-400/80 font-inter transition-colors active:scale-95"
                  onClick={() => handleRemove(track.id)}
                >
                  Remove from playlist
                </button>
              </div>
            )}

            {/* Swipe hint */}
            <p className="text-center text-[11px] text-on-surface-variant/30 font-inter mt-4">
              Swipe to browse tracks
            </p>
          </>
        )}
      </main>
    </div>
  )
}
