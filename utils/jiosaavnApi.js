import { saveAudioFile } from './indexedDB'

const BASE = 'https://saavn.sumit.co/api'

export function buildOnlineTrack(song) {
  const cover = song.image?.find(i => i.quality === '500x500')?.url
    || song.image?.find(i => i.quality === '150x150')?.url
    || null
  const downloadUrl = song.downloadUrl?.find(d => d.quality === '320kbps')?.url
    || song.downloadUrl?.find(d => d.quality === '160kbps')?.url
    || null
  const artists = (song.artists?.primary || []).map(a => a.name).filter(Boolean)
  return {
    id: `js_${song.id}`,
    title: song.name || 'Unknown',
    artist: artists.join(', ') || 'Unknown Artist',
    album: song.album?.name || 'Unknown Album',
    duration: song.duration || 0,
    cover,
    src: downloadUrl,
    liked: false,
    _source: 'online',
    _language: song.language || null,
    _label: song.label || null,
    _year: song.year || null,
    _jiosaavnUrl: song.url || null,
  }
}

export async function searchOnlineSongs(query, limit = 20) {
  if (!query?.trim()) return []
  try {
    const url = `${BASE}/search/songs?query=${encodeURIComponent(query.trim())}&limit=${limit}`
    const res = await fetch(url)
    if (!res.ok) return []
    const body = await res.json()
    if (!body?.success || !body?.data?.results) return []
    const tracks = body.data.results.map(buildOnlineTrack)
    const seenIds = new Set()
    const seenTitles = new Set()
    return tracks.filter(t => {
      if (seenIds.has(t.id)) return false
      seenIds.add(t.id)
      const titleKey = (t.title || '').toLowerCase().trim()
      if (seenTitles.has(titleKey)) return false
      seenTitles.add(titleKey)
      return true
    })
  } catch {
    return []
  }
}

const DEFAULT_SEEDS = ['trending english songs', 'trending hindi songs', 'top hits', 'latest songs 2025', 'bollywood hits']

export async function getRecommendations(library = []) {
  const artistCounts = {}
  library.forEach(t => {
    if (t.artist) {
      const parts = t.artist.split(/[,&]/).map(s => s.trim()).filter(Boolean)
      parts.forEach(a => { artistCounts[a] = (artistCounts[a] || 0) + 1 })
    }
  })

  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name)

  const queries = topArtists.length > 0 ? topArtists : DEFAULT_SEEDS

  try {
    const results = await Promise.allSettled(
      queries.map(q => searchOnlineSongs(q, 5))
    )
    const all = results
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value)
    const seenIds = new Set()
    const seenTitles = new Set()
    return all.filter(t => {
      if (seenIds.has(t.id)) return false
      seenIds.add(t.id)
      const titleKey = (t.title || '').toLowerCase().trim()
      if (seenTitles.has(titleKey)) return false
      seenTitles.add(titleKey)
      return true
    }).slice(0, 15)
  } catch {
    return []
  }
}

export async function getRelatedSongs(track, limit = 5) {
  if (!track || track._source !== 'online') return []
  const artistName = track.artist?.split(',')[0]?.trim()
  if (!artistName) return []
  try {
    const url = `${BASE}/search/songs?query=${encodeURIComponent(artistName)}&limit=15`
    const res = await fetch(url)
    if (!res.ok) return []
    const body = await res.json()
    if (!body?.success || !body?.data?.results) return []

    const currentTitle = track.title?.toLowerCase() || ''
    const related = body.data.results
      .filter(s => s.name?.toLowerCase() !== currentTitle)
      .slice(0, limit + 5)
      .map(buildOnlineTrack)
    const seenIds = new Set()
    const seenTitles = new Set()
    return related.filter(t => {
      if (seenIds.has(t.id)) return false
      seenIds.add(t.id)
      const titleKey = (t.title || '').toLowerCase().trim()
      if (seenTitles.has(titleKey)) return false
      seenTitles.add(titleKey)
      return true
    }).slice(0, limit)
  } catch {
    return []
  }
}

export async function getOnlineSongDetails(id) {
  try {
    const url = `${BASE}/songs/${encodeURIComponent(id)}`
    const res = await fetch(url)
    if (!res.ok) return null
    const body = await res.json()
    if (!body?.success || !body?.data) return null
    return buildOnlineTrack(body.data)
  } catch {
    return null
  }
}

export async function downloadOnlineTrack(track) {
  try {
    const audioResp = await fetch(track.src)
    if (!audioResp.ok) return null
    const audioBlob = await audioResp.blob()

    let coverBlob = null
    if (track.cover && !track.cover.startsWith('data:')) {
      try {
        const coverResp = await fetch(track.cover)
        if (coverResp.ok) coverBlob = await coverResp.blob()
      } catch {}
    }

    await saveAudioFile(track.id, audioBlob, coverBlob)

    const srcUrl = URL.createObjectURL(audioBlob)
    const coverUrl = coverBlob ? URL.createObjectURL(coverBlob) : track.cover

    return {
      ...track,
      src: srcUrl,
      cover: coverUrl,
      _source: 'downloaded',
      _isDownloaded: true,
    }
  } catch {
    return null
  }
}
