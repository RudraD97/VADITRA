import React, { useState, useEffect } from 'react'
import usePlayerStore from '../store/playerStore'
import Visualizer from '../components/Visualizer'
import BottomNav from '../components/BottomNav'
import { formatTime, DEFAULT_COVER } from '../utils/audioUtils'
import { getRelatedSongs, downloadOnlineTrack } from '../utils/jiosaavnApi'

export default function PlayerPage({ frequencyData, seekTo, seekBarProps, initContext }) {

  const {
    currentTrack, isPlaying, currentTime, duration,
    repeatMode, isShuffle,
    togglePlay, playNext, playPrevious,
    toggleShuffle, cycleRepeat, toggleLike,
    setPlayerExpanded, setActiveView,
    queue, queueIndex, deleteTrack, setQueue,
    library, addToLibrary, setCurrentTrack,
  } = usePlayerStore()

  const upcomingLocal = queue.slice(queueIndex + 1, queueIndex + 6)
  const [upcomingRelated, setUpcomingRelated] = useState([])
  const [relatedError, setRelatedError] = useState(null)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false)
  const [closing, setClosing] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const isDownloaded = currentTrack?._source === 'online' && library.some(t => t.id === currentTrack.id && t._isDownloaded)

  const handleDownload = async () => {
    if (!currentTrack || downloading) return
    setDownloading(true)
    const result = await downloadOnlineTrack(currentTrack)
    if (result) {
      addToLibrary(result)
      usePlayerStore.setState({ currentTrack: result })
    }
    setDownloading(false)
    setShowHeaderMenu(false)
  }

  useEffect(() => {
    if (currentTrack?._source === 'online') {
      setRelatedError(null)
      getRelatedSongs(currentTrack).then(result => {
        if (result.success) {
          setUpcomingRelated(result.data)
          setRelatedError(null)
        } else {
          setUpcomingRelated([])
          setRelatedError(result.error || 'Could not load related songs')
        }
      })
    } else {
      setUpcomingRelated([])
      setRelatedError(null)
    }
  }, [currentTrack?.id, currentTrack?._source])

  const upcoming = currentTrack?._source === 'online' && upcomingRelated.length > 0
    ? upcomingRelated
    : upcomingLocal

  const handleShare = async () => {
    const track = currentTrack
    if (!track || !track.src) return
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

  const { barRef, displayProgress, handleBarClick, handleBarMouseDown } = seekBarProps

  const handlePlayClick = () => {
    initContext?.()
    togglePlay()
  }

  const handleClose = () => {
    setClosing(true)
    setTimeout(() => { setPlayerExpanded(false); setActiveView('home') }, 300)
  }

  const repeatIcon = repeatMode === 'one' ? 'repeat_one' : 'repeat'
  const repeatActive = repeatMode !== 'none'
  const glowIntensity = isPlaying ? '0.2' : '0.08'

  if (!currentTrack) return null

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-surface"
    >
      {/* Ambient glow behind album art */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-80 h-80 top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-1000"
          style={{
            background: isPlaying
              ? 'radial-gradient(circle, rgba(174,211,102,0.15) 0%, rgba(73,104,0,0.08) 50%, transparent 70%)'
              : 'radial-gradient(circle, rgba(174,211,102,0.08) 0%, rgba(73,104,0,0.04) 50%, transparent 70%)',
            filter: 'blur(60px)',
            animation: isPlaying ? 'glowPulse 3s ease-in-out infinite' : 'none',
          }}
        />
      </div>

      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pb-[66px]">

        {/* ── VADITRA Header Bar ───────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-30 flex items-center h-[72px] px-4 flex-shrink-0"
          style={{
            background: 'rgba(30, 32, 31, 0.96)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(68,73,57,0.25)',
            boxShadow: '0 4px 24px -8px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex-1 flex items-center justify-center">
            <div className="relative inline-flex items-center justify-center select-none">
              <span className="material-symbols-outlined absolute -left-[22px] -top-[2px] text-[11px] text-primary-fixed-dim rotate-[-20deg]" style={{ animation: 'blinkIcon 1s ease-in-out infinite', fontVariationSettings: "'FILL' 1" }}>headphones</span>
              <span
                className="text-[22px] font-black tracking-tighter italic font-syne leading-none relative z-10"
                style={{
                  background: 'linear-gradient(90deg, #aed366, #c9f07e, #ffffff, #c9f07e, #aed366)',
                  backgroundSize: '200% 100%',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  animation: 'gradientFlow 4s ease-in-out infinite',
                }}
              >
                VADITRA
              </span>
              <span className="absolute -right-[18px] -top-[1px] text-[11px] text-primary-fixed-dim/80 rotate-[15deg]" style={{ animation: 'blinkIcon 1.2s ease-in-out infinite 0.3s' }}>♪</span>
              <span className="absolute -right-[32px] top-[2px] text-[9px] text-primary-fixed-dim/50 rotate-[30deg]" style={{ animation: 'blinkIcon 0.8s ease-in-out infinite 0.5s' }}>♫</span>
            </div>
          </div>

        </div>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <header
          className="flex-shrink-0 flex flex-col items-center pt-2 z-10"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.1s both' }}
        >
          <div className="w-8 h-1 bg-on-surface/20 rounded-full mb-3" />
          <div className="flex justify-between items-center w-full px-5 h-[64px]">
            <div className="flex items-center justify-start w-12">
              <button
                className="w-10 h-10 flex items-center justify-center text-on-surface hover:text-primary-fixed-dim transition-colors active:scale-90"
                onClick={handleClose}
                aria-label="Close"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[11px] text-on-surface-variant/50 uppercase tracking-[0.2em] font-inter">
                Now Playing
              </span>
              <span className="text-[14px] font-semibold text-on-surface font-syne truncate max-w-[180px]">
                {currentTrack?.album || 'VADITRA'}
              </span>
            </div>
            <div className="flex items-center justify-end w-12">
              <button
                onClick={e => { e.stopPropagation(); setShowHeaderMenu(v => !v) }}
                className="w-9 h-9 flex items-center justify-center rounded-lg transition-all text-on-surface-variant/40"
                style={{ background: showHeaderMenu ? 'rgba(174,211,102,0.1)' : 'transparent' }}
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>more_vert</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Album Art ──────────────────────────────────────────────────── */}
        <section
          className="flex flex-col items-center px-8 mt-6 sm:mt-12"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both' }}
        >
          <div className="relative w-full max-w-[300px] aspect-square flex items-center justify-center">

            {/* Aurora backdrop — subtle animated gradient clouds */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[32px]">
              <div
                className="absolute inset-0 animate-auroraShift"
                style={{
                  background: `
                    radial-gradient(ellipse at 30% 20%, rgba(174,211,102,0.12) 0%, transparent 60%),
                    radial-gradient(ellipse at 70% 80%, rgba(201,240,126,0.08) 0%, transparent 50%),
                    radial-gradient(ellipse at 50% 50%, rgba(73,104,0,0.06) 0%, transparent 50%)
                  `,
                  filter: 'blur(50px)',
                  transform: 'scale(1.3)',
                }}
              />
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute w-1 h-1 bg-primary-fixed-dim/40 rounded-full animate-particle1" style={{ top: '12%', left: '18%' }} />
              <div className="absolute w-[3px] h-[3px] bg-primary-fixed-dim/30 rounded-full animate-particle2" style={{ top: '22%', right: '20%' }} />
              <div className="absolute w-1 h-1 bg-primary-fixed-dim/25 rounded-full animate-particle3" style={{ bottom: '18%', left: '25%' }} />
              <div className="absolute w-[3px] h-[3px] bg-primary-fixed-dim/35 rounded-full animate-particle1" style={{ bottom: '28%', right: '15%' }} />
              <div className="absolute w-1 h-1 bg-primary/20 rounded-full animate-particle2" style={{ top: '8%', left: '48%' }} />
              <div className="absolute w-[3px] h-[3px] bg-primary-fixed-dim/25 rounded-full animate-particle3" style={{ top: '50%', right: '10%' }} />
            </div>

            {/* Outer aura — concentric glowing rings */}
            <div
              className="absolute inset-[2%] rounded-[24px] transition-all duration-1000 pointer-events-none"
              style={{
                boxShadow: isPlaying
                  ? `0 0 40px 8px rgba(174,211,102,0.12), 0 0 80px 20px rgba(174,211,102,0.06)`
                  : `0 0 20px 4px rgba(174,211,102,0.05)`,
              }}
            />
            <div
              className="absolute inset-[6%] rounded-[20px] transition-all duration-1000 pointer-events-none"
              style={{
                boxShadow: isPlaying
                  ? `0 0 60px 15px rgba(174,211,102,0.08), inset 0 0 30px rgba(174,211,102,0.03)`
                  : `0 0 20px 5px rgba(174,211,102,0.03)`,
              }}
            />

            {/* Album art card — floating glass card */}
            <div
              className="relative w-[82%] aspect-square rounded-[20px] overflow-hidden
                transition-all duration-500"
              style={{
                boxShadow: isPlaying
                  ? `0 24px 64px -8px rgba(0,0,0,0.5), 0 0 48px rgba(174,211,102,0.08)`
                  : `0 20px 48px -8px rgba(0,0,0,0.4)`,
                animation: isPlaying ? 'float 5s ease-in-out infinite' : 'none',
              }}
            >
              <img
                src={currentTrack.cover || DEFAULT_COVER}
                onError={e => { if (e.target.src !== DEFAULT_COVER) e.target.src = DEFAULT_COVER }}
                alt="Album Art"
                className="w-full h-full object-cover select-none pointer-events-none"
                draggable={false}
              />

              {/* Glass shimmer overlay */}
              <div
                className="absolute inset-0 pointer-events-none animate-shimmer"
                style={{
                  background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.07) 40%, transparent 55%)',
                }}
              />

              {/* Bottom vignette */}
              <div
                className="absolute bottom-0 left-0 right-0 h-[35%] pointer-events-none"
                style={{
                  background: 'linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%)',
                }}
              />

              {/* Subtle border glow */}
              <div
                className="absolute inset-0 rounded-[20px] pointer-events-none"
                style={{
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              />
            </div>
          </div>
        </section>

        {/* ── Track Info ─────────────────────────────────────────────────── */}
        <section
          className="px-6 flex flex-col items-center mt-4 sm:mt-12"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.3s both' }}
        >
          <h1 className="text-[22px] font-bold text-center truncate max-w-full font-syne text-on-surface">
            {currentTrack.title}
          </h1>
          <p className="text-[14px] text-primary-fixed-dim/80 mt-1 text-center truncate max-w-full font-inter">
            {currentTrack.artist || 'Unknown Artist'}
          </p>
          <p className="text-[11px] text-on-surface-variant/40 mt-0.5 font-inter">
            {currentTrack.album || ''}
          </p>
        </section>

        {/* ── Visualizer ─────────────────────────────────────────────────── */}
        <div className="px-5 mt-4 sm:mt-10" style={{ animation: 'fadeInUp 0.5s ease-out 0.35s both' }}>
          <Visualizer frequencyData={frequencyData} isPlaying={isPlaying} />
        </div>

        {/* ── Controls ───────────────────────────────────────────────────── */}
        <section
          className="px-5 mt-6 sm:mt-10"
          style={{ animation: 'fadeInUp 0.5s ease-out 0.45s both' }}
        >
          {/* Seek Bar */}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-[11px] text-on-surface-variant/50 font-mono w-8 text-right">
              {formatTime(currentTime)}
            </span>
            <div
              ref={barRef}
              className="flex-1 h-1.5 rounded-full relative cursor-pointer group"
              style={{ background: 'rgba(68,73,57,0.5)' }}
              onClick={handleBarClick}
              onMouseDown={handleBarMouseDown}
            >
              <div
                className="h-full rounded-full relative overflow-hidden"
                style={{
                  width: `${displayProgress}%`,
                  background: 'linear-gradient(90deg, #aed366, #c9f07e)',
                  animation: 'seekGlow 3s ease-in-out infinite',
                }}
              >
                <div className="absolute inset-0 w-full h-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)', animation: 'seekShimmer 3s ease-in-out infinite' }} />
              </div>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-primary-fixed-dim opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${displayProgress}% - 7px)`, boxShadow: '0 0 12px rgba(174,211,102,0.4)' }}
              />
            </div>
            <span className="text-[11px] text-on-surface-variant/50 font-mono w-8">
              {formatTime(duration)}
            </span>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center justify-center mt-4 gap-6">
            <button
              onClick={toggleShuffle}
              className="w-10 h-10 flex items-center justify-center active:scale-90 transition-transform"
              style={{ color: isShuffle ? '#aed366' : 'rgba(226,227,224,0.5)' }}
              aria-label="Shuffle"
            >
              <span className="material-symbols-outlined text-[22px]">shuffle</span>
            </button>
            <button
              onClick={playPrevious}
              className="w-10 h-10 flex items-center justify-center text-on-surface/70 hover:text-on-surface active:scale-90 transition-all"
              aria-label="Previous"
            >
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>skip_previous</span>
            </button>
            <button
              onClick={handlePlayClick}
              className="w-16 h-16 flex items-center justify-center active:scale-90 transition-transform duration-200 rounded-full"
              style={{
                background: 'radial-gradient(circle at 30% 30%, #c9f07e, #aed366)',
                boxShadow: `0 12px 32px -8px rgba(174,211,102,0.3)`,
                animation: isPlaying ? 'playBtnPulse 2.5s ease-in-out infinite' : 'none',
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              <span className="material-symbols-outlined text-[36px] text-on-primary-fixed" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button
              onClick={playNext}
              className="w-10 h-10 flex items-center justify-center text-on-surface/70 hover:text-on-surface active:scale-90 transition-all"
              aria-label="Next"
            >
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>skip_next</span>
            </button>
            <button
              onClick={cycleRepeat}
              className="w-10 h-10 flex items-center justify-center active:scale-90 transition-transform"
              style={{ color: repeatActive ? '#aed366' : 'rgba(226,227,224,0.5)' }}
              aria-label="Repeat"
            >
              <span className="material-symbols-outlined text-[22px]">{repeatIcon}</span>
            </button>
          </div>
        </section>

        {/* ── Upcoming Queue ─────────────────────────────────────────────── */}
        {(upcoming.length > 0 || relatedError) && (
          <section
            className="px-5 mt-6 mb-6"
            style={{ animation: 'fadeInUp 0.5s ease-out 0.4s both' }}
          >
            <h3 className="text-[12px] text-on-surface-variant/40 uppercase tracking-[0.15em] font-inter mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]" style={{ color: '#aed366', fontVariationSettings: "'FILL' 1" }}>queue_music</span>
              Up next
            </h3>
            {/* Section divider */}
            <div className="mb-4 mt-0.5" style={{ height: '1px', background: 'linear-gradient(90deg, rgba(174,211,102,0.2), rgba(174,211,102,0.05), transparent)' }} />
            {relatedError && (
              <div className="flex items-center gap-2 px-3 py-2 mb-2 rounded-xl" style={{ background: 'rgba(242, 139, 130, 0.08)', border: '1px solid rgba(242, 139, 130, 0.15)' }}>
                <span className="material-symbols-outlined text-[14px] text-error/60">cloud_off</span>
                <p className="text-[11px] text-error/70 font-inter">{relatedError}</p>
              </div>
            )}
            <div className="space-y-1">
              {upcoming.map((track, i) => (
                <div key={track.id + i} className="flex items-center gap-3 px-1.5 py-1.5 rounded-lg cursor-pointer hover:bg-surface-container/60 transition-all active:scale-[0.98]" style={{ opacity: 1 - i * 0.15 }} onClick={() => { setQueue(upcoming, i); setPlayerExpanded(true) }}>
                  <img src={track.cover || DEFAULT_COVER} alt="" className="w-9 h-9 rounded-lg object-cover bg-surface-variant flex-shrink-0 ring-1 ring-white/5" onError={e => { if (e.target.src !== DEFAULT_COVER) e.target.src = DEFAULT_COVER }} />
                  <span className="material-symbols-outlined text-[14px] text-primary-fixed-dim/50 flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>play_circle</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-medium truncate text-on-surface/70 font-inter">{track.title}</p>
                    <p className="text-[10px] text-on-surface-variant/40 truncate font-inter">{track.artist || 'Unknown'}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      <style>{`
        @keyframes playerEntrance {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes playerExit {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(20px); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes auroraShift {
          0% { transform: scale(1.3) rotate(0deg); }
          50% { transform: scale(1.35) rotate(3deg); }
          100% { transform: scale(1.3) rotate(0deg); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes particle1 {
          0%, 100% { opacity: 0.3; transform: translateY(0) scale(1); }
          50% { opacity: 0.8; transform: translateY(-16px) scale(1.2); }
        }
        @keyframes particle2 {
          0%, 100% { opacity: 0.2; transform: translateY(0) scale(1); }
          50% { opacity: 0.6; transform: translateY(12px) scale(0.8); }
        }
        @keyframes particle3 {
          0%, 100% { opacity: 0.25; transform: translateX(0) scale(1); }
          50% { opacity: 0.7; transform: translateX(-10px) scale(1.1); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes playBtnPulse {
          0%, 100% { box-shadow: 0 12px 32px rgba(174,211,102,0.3); }
          50% { box-shadow: 0 16px 48px rgba(174,211,102,0.5); }
        }
        @keyframes seekGlow {
          0%, 100% { box-shadow: 0 0 8px rgba(174,211,102,0.35), 0 0 2px rgba(174,211,102,0.25); }
          50% { box-shadow: 0 0 16px rgba(174,211,102,0.55), 0 0 6px rgba(174,211,102,0.35); }
        }
        @keyframes seekShimmer {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(100%); }
          100% { transform: translateX(100%); }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #aed366;
          cursor: pointer;
          box-shadow: 0 0 12px rgba(174,211,102,0.4);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        .group:hover input[type="range"]::-webkit-slider-thumb {
          opacity: 1;
        }
        input[type="range"]::-moz-range-thumb {
          height: 14px;
          width: 14px;
          border-radius: 50%;
          background: #aed366;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 12px rgba(174,211,102,0.4);
        }
      `}</style>
      </div>
      <BottomNav />

      {/* ── Track menu centered overlay ── */}
      {showHeaderMenu && currentTrack && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" onClick={() => setShowHeaderMenu(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-xs mx-auto rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: 'rgba(30, 32, 31, 0.98)', backdropFilter: 'blur(20px)', border: '1px solid rgba(68, 73, 57, 0.25)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Track info header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(68, 73, 57, 0.2)' }}>
              <img src={currentTrack.cover || DEFAULT_COVER} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-surface-variant" onError={e => { if (e.target.src !== DEFAULT_COVER) e.target.src = DEFAULT_COVER }} />
              <div className="flex-grow min-w-0">
                <p className="text-[14px] font-medium truncate font-inter text-[#e2e3e0]">{currentTrack.title}</p>
                <p className="text-[11px] text-[#c4c9b5]/50 truncate font-inter">{currentTrack.artist || 'Unknown Artist'}</p>
              </div>
              <button onClick={() => setShowHeaderMenu(false)} className="text-[#c4c9b5]/40 active:scale-90 flex-shrink-0">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Action buttons */}
            <div className="py-2">
              <button onClick={() => { toggleLike(currentTrack.id); setShowHeaderMenu(false) }}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[20px]" style={{ color: currentTrack.liked ? '#aed366' : 'rgba(226,227,224,0.8)', fontVariationSettings: currentTrack.liked ? "'FILL' 1" : "'FILL' 0'" }}>favorite</span>
                <span className="text-[14px] font-inter text-[#e2e3e0]">{currentTrack.liked ? 'Liked' : 'Like'}</span>
              </button>
              <button onClick={() => { handleShare(); setShowHeaderMenu(false) }}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[20px] text-[#e2e3e0]/80">share</span>
                <span className="text-[14px] font-inter text-[#e2e3e0]">Share</span>
              </button>
              {currentTrack?._source === 'online' && (
                <button onClick={handleDownload}
                  className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left"
                >
                  <span className={`material-symbols-outlined text-[20px] ${isDownloaded ? 'text-primary-fixed-dim' : 'text-[#e2e3e0]/80'}`} style={{ fontVariationSettings: isDownloaded ? "'FILL' 1" : "'FILL' 0" }}>
                    {downloading ? 'hourglass_top' : isDownloaded ? 'check_circle' : 'download'}
                  </span>
                  <span className="text-[14px] font-inter" style={{ color: isDownloaded ? '#aed366' : '#e2e3e0' }}>
                    {downloading ? 'Downloading...' : isDownloaded ? 'Downloaded' : 'Download'}
                  </span>
                </button>
              )}
              <div className="mx-5 my-1 h-px" style={{ background: 'rgba(68, 73, 57, 0.25)' }} />
              <button onClick={() => { deleteTrack(currentTrack.id); setPlayerExpanded(false); setActiveView('home'); setShowHeaderMenu(false) }}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-white/5 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-[20px] text-error">delete</span>
                <span className="text-[14px] font-inter text-error">Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
