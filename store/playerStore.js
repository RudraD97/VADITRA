// playerStore.js — Global state for VADITRA music player
// Use with: import { usePlayerStore } from '../store/playerStore'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { revokeBlobUrl } from '../utils/audioUtils'
import { deleteAudioFile } from '../utils/indexedDB'
import { getAudioElement, playSrc, pauseAudio, resumeAudio } from '../utils/audioElement'

const usePlayerStore = create(
  persist(
    (set, get) => ({
      // ─── Current Track ───────────────────────────────────────────
      currentTrack: null,       // { id, title, artist, album, duration, src, cover, liked }
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 0.8,
      isMuted: false,

      // ─── Playback Modes ──────────────────────────────────────────
      isShuffle: false,
      repeatMode: 'none',       // 'none' | 'all' | 'one'

      // ─── Queue & History ─────────────────────────────────────────
      queue: [],                // Array of track objects (current playlist order)
      originalQueue: [],        // Unshuffled queue for shuffle toggle
      history: [],              // Previously played tracks
      queueIndex: 0,            // Index of currentTrack in queue

      // ─── Playlists ───────────────────────────────────────────────
      playlists: [],            // [{ id, name, cover, tracks: [] }]
      activePlaylistId: null,

      // ─── Library (all uploaded tracks) ──────────────────────────
      library: [],              // All tracks ever added

      // ─── UI State ────────────────────────────────────────────────
      activeView: 'home',    // 'home' | 'search' | 'playlist' | 'player' | 'upload' | 'downloads' | 'profile'
      isPlayerExpanded: false,
      isQueueVisible: false,
      audioError: null,

      // ─── Actions: Playback ───────────────────────────────────────
      // These call audio element methods synchronously inside the action so
      // the browser sees them as user-gesture-initiated (not blocked by autoplay).
      play: () => {
        resumeAudio()
        set({ isPlaying: true })
      },
      pause: () => {
        pauseAudio()
        set({ isPlaying: false })
      },

      togglePlay: () => {
        const { isPlaying, currentTrack } = get()
        if (isPlaying) {
          pauseAudio()
          set({ isPlaying: false })
        } else if (currentTrack?.src) {
          playSrc(currentTrack.src)
          set({ isPlaying: true })
        }
      },

      setCurrentTrack: (track) => {
        if (track?.src) playSrc(track.src)
        set({
          currentTrack: track,
          isPlaying: true,
          currentTime: 0,
        })
      },

      setCurrentTime: (time) => set({ currentTime: time }),
      setDuration: (duration) => set({ duration }),

      seek: (time) => set({ currentTime: time }),

      setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
      toggleMute: () => {
        const { isMuted, volume } = get()
        set({ isMuted: !isMuted, volume: isMuted ? (volume || 0.5) : volume })
      },

      // ─── Actions: Navigation ─────────────────────────────────────
      playNext: () => {
        const { queue, queueIndex, isShuffle, repeatMode, history, currentTrack } = get()
        if (!queue.length) return

        if (currentTrack) {
          set({ history: [...history, currentTrack] })
        }

        if (repeatMode === 'one') {
          const audio = getAudioElement()
          if (audio) {
            audio.currentTime = 0
            audio.play().catch(() => {})
          }
          set({ currentTime: 0, isPlaying: true })
          return
        }

        let nextIndex
        if (isShuffle) {
          do {
            nextIndex = Math.floor(Math.random() * queue.length)
          } while (nextIndex === queueIndex && queue.length > 1)
        } else {
          nextIndex = queueIndex + 1
          if (nextIndex >= queue.length) nextIndex = 0
        }

        const nextTrack = queue[nextIndex]
        if (nextTrack?.src) playSrc(nextTrack.src)
        set({
          queueIndex: nextIndex,
          currentTrack: nextTrack,
          currentTime: 0,
          isPlaying: true,
        })
      },

      playPrevious: () => {
        const { queue, queueIndex, currentTime, history, isShuffle } = get()

        if (currentTime > 3) {
          set({ currentTime: 0 })
          return
        }

        if (history.length > 0) {
          const prev = history[history.length - 1]
          const newHistory = history.slice(0, -1)
          const prevIndex = queue.findIndex(t => t.id === prev.id)
          if (prev?.src) playSrc(prev.src)
          set({
            currentTrack: prev,
            queueIndex: prevIndex >= 0 ? prevIndex : queueIndex,
            currentTime: 0,
            isPlaying: true,
            history: newHistory,
          })
          return
        }

        if (isShuffle) {
          let prevIndex
          do {
            prevIndex = Math.floor(Math.random() * queue.length)
          } while (prevIndex === queueIndex && queue.length > 1)
          const prevTrack = queue[prevIndex]
          if (prevTrack?.src) playSrc(prevTrack.src)
          set({
            queueIndex: prevIndex,
            currentTrack: prevTrack,
            currentTime: 0,
            isPlaying: true,
          })
          return
        }

        const prevIndex = Math.max(0, queueIndex - 1)
        const prevTrack = queue[prevIndex]
        if (prevTrack?.src) playSrc(prevTrack.src)
        set({
          queueIndex: prevIndex,
          currentTrack: prevTrack,
          currentTime: 0,
          isPlaying: true,
        })
      },

      // ─── Actions: Modes ──────────────────────────────────────────
      toggleShuffle: () => {
        const { isShuffle, queue, originalQueue, currentTrack } = get()
        if (!isShuffle) {
          const currentId = currentTrack?.id
          const shuffled = [...queue].sort(() => Math.random() - 0.5)
          const newIndex = currentId ? shuffled.findIndex(t => t.id === currentId) : 0
          set({ isShuffle: true, originalQueue: queue, queue: shuffled, queueIndex: Math.max(0, newIndex) })
        } else {
          const restored = originalQueue.length ? originalQueue : queue
          const currentId = currentTrack?.id
          const newIndex = currentId ? restored.findIndex(t => t.id === currentId) : 0
          set({ isShuffle: false, queue: restored, queueIndex: Math.max(0, newIndex) })
        }
      },

      cycleRepeat: () => {
        const { repeatMode } = get()
        const modes = ['none', 'all', 'one']
        const next = modes[(modes.indexOf(repeatMode) + 1) % modes.length]
        set({ repeatMode: next })
      },

      // ─── Actions: Queue ──────────────────────────────────────────
      setQueue: (tracks, startIndex = 0) => {
        const track = tracks[startIndex]
        if (track?.src) playSrc(track.src)
        set({
          queue: tracks,
          originalQueue: tracks,
          queueIndex: startIndex,
          currentTrack: track || null,
          currentTime: 0,
          isPlaying: true,
          history: [],
        })
      },

      playTrackFromQueue: (index) => {
        const { queue, currentTrack, history } = get()
        const track = queue[index]
        if (track?.src) playSrc(track.src)
        if (currentTrack) set({ history: [...history, currentTrack] })
        set({
          queueIndex: index,
          currentTrack: track || null,
          currentTime: 0,
          isPlaying: true,
        })
      },

      addToQueue: (track) => {
        const { queue } = get()
        set({ queue: [...queue, track] })
      },

      removeFromQueue: (index) => {
        const { queue, queueIndex } = get()
        const newQueue = queue.filter((_, i) => i !== index)
        const newIndex = index < queueIndex ? queueIndex - 1 : queueIndex
        set({ queue: newQueue, queueIndex: Math.min(newIndex, newQueue.length - 1) })
      },

      toggleQueueVisible: () => set(s => ({ isQueueVisible: !s.isQueueVisible })),

      // ─── Actions: Library ────────────────────────────────────────
      addToLibrary: (tracks) => {
        const { library } = get()
        const newTracks = Array.isArray(tracks) ? tracks : [tracks]
        const unique = newTracks.filter(t => !library.find(l => l.id === t.id))
        set({ library: [...library, ...unique] })
      },

      restoreTrackSrc: (trackId, src, cover = null) => {
        const { library, currentTrack } = get()
        set({
          library: library.map(t => t.id === trackId ? { ...t, src, ...(cover ? { cover } : {}) } : t),
          currentTrack: currentTrack?.id === trackId ? { ...currentTrack, src, ...(cover ? { cover } : {}) } : currentTrack,
        })
      },

      removeFromLibrary: (trackId) => {
        const { library } = get()
        set({ library: library.filter(t => t.id !== trackId) })
      },

      toggleLike: (trackId) => {
        const { library, currentTrack, playlists } = get()
        const updatedLibrary = library.map(t =>
          t.id === trackId ? { ...t, liked: !t.liked } : t
        )
        const updatedCurrent = currentTrack?.id === trackId
          ? { ...currentTrack, liked: !currentTrack.liked }
          : currentTrack
        const updatedPlaylists = playlists.map(p => ({
          ...p,
          tracks: p.tracks.map(t => t.id === trackId ? { ...t, liked: !t.liked } : t)
        }))
        set({ library: updatedLibrary, currentTrack: updatedCurrent, playlists: updatedPlaylists })
      },

      deleteTrack: (trackId) => {
        const { library, playlists, currentTrack } = get()
        const track = library.find(t => t.id === trackId)
        if (track) {
          revokeBlobUrl(track.src)
          revokeBlobUrl(track.cover)
        }
        const newLibrary = library.filter(t => t.id !== trackId)
        const newPlaylists = playlists.map(p => ({
          ...p,
          tracks: p.tracks.filter(t => t.id !== trackId),
        }))
        const isCurrent = currentTrack?.id === trackId
        if (isCurrent) pauseAudio()
        deleteAudioFile(trackId)
        set({
          library: newLibrary,
          playlists: newPlaylists,
          currentTrack: isCurrent ? null : currentTrack,
          isPlaying: isCurrent ? false : get().isPlaying,
        })
      },

      // ─── Actions: Playlists ──────────────────────────────────────
      createPlaylist: (name, cover = null) => {
        const { playlists } = get()
        const newPlaylist = {
          id: `playlist_${Date.now()}`,
          name,
          cover,
          tracks: [],
          createdAt: new Date().toISOString(),
        }
        set({ playlists: [...playlists, newPlaylist] })
        return newPlaylist.id
      },

      deletePlaylist: (playlistId) => {
        const { playlists, activePlaylistId } = get()
        set({
          playlists: playlists.filter(p => p.id !== playlistId),
          activePlaylistId: activePlaylistId === playlistId ? null : activePlaylistId,
        })
      },

      renamePlaylist: (playlistId, newName) => {
        const { playlists } = get()
        set({
          playlists: playlists.map(p => p.id === playlistId ? { ...p, name: newName } : p)
        })
      },

      addTrackToPlaylist: (playlistId, track) => {
        const { playlists } = get()
        set({
          playlists: playlists.map(p => {
            if (p.id !== playlistId) return p
            if (p.tracks.find(t => t.id === track.id)) return p
            return { ...p, tracks: [...p.tracks, track] }
          })
        })
      },

      removeTrackFromPlaylist: (playlistId, trackId) => {
        const { playlists } = get()
        set({
          playlists: playlists.map(p =>
            p.id === playlistId
              ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) }
              : p
          )
        })
      },

      setActivePlaylist: (playlistId) => set({ activePlaylistId: playlistId }),

      playPlaylist: (playlistId, startIndex = 0) => {
        const { playlists } = get()
        const playlist = playlists.find(p => p.id === playlistId)
        if (!playlist || !playlist.tracks.length) return
        get().setQueue(playlist.tracks, startIndex)
        set({ activePlaylistId: playlistId, isPlayerExpanded: true })
      },

      // ─── Actions: UI ─────────────────────────────────────────────
      setActiveView: (view) => set({ activeView: view, isPlayerExpanded: view === 'player' ? get().isPlayerExpanded : false }),
      setPlayerExpanded: (val) => set({ isPlayerExpanded: val, ...(val ? { activeView: 'player' } : {}) }),
      goHome: () => set({ activeView: 'home', isPlayerExpanded: false }),
      togglePlayerExpanded: () => set(s => ({ isPlayerExpanded: !s.isPlayerExpanded })),
    }),

    {
      name: 'sona-player-store',
      // Only persist data, not playback state
      // Strip blob: URLs before saving — they're session-scoped and
      // won't survive a page reload.
      partialize: (state) => {
        const clear = (tracks) => tracks.map(t => ({
          ...t,
          src: t.src?.startsWith('blob:') ? null : t.src,
          cover: t.cover?.startsWith('blob:') ? null : t.cover,
        }))
        return {
          library: clear(state.library),
          playlists: state.playlists.map(p => ({
            ...p,
            cover: p.cover?.startsWith('blob:') ? null : p.cover,
            tracks: clear(p.tracks),
          })),
          volume: state.volume,
          isShuffle: state.isShuffle,
          repeatMode: state.repeatMode,
          activePlaylistId: state.activePlaylistId,
        }
      },
      version: 1,
      // One-time migration from old persisted blob URLs
      migrate: (persisted) => {
        if (!persisted) return persisted
        const clear = (tracks) => (tracks || []).map(t => ({
          ...t,
          src: t.src?.startsWith('blob:') ? null : t.src,
          cover: t.cover?.startsWith('blob:') ? null : t.cover,
        }))
        return {
          ...persisted,
          library: clear(persisted.library || []),
          playlists: (persisted.playlists || []).map(p => ({
            ...p,
            cover: p.cover?.startsWith('blob:') ? null : p.cover,
            tracks: clear(p.tracks || []),
          })),
        }
      },
    }
  )
)

export default usePlayerStore
