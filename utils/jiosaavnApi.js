import { saveAudioFile } from './indexedDB'

const BASE_URLS = [
  'https://saavn.sumit.co/api',
  'https://saavn.me',
  'https://jiosaavn-api-psi.vercel.app/api',
  'https://jiosaavn-cors-proxy.vercel.app/api',
]

function isRateLimitStatus(status) {
  return status === 429 || status === 403
}

function getUserFriendlyError(errors, status) {
  if (isRateLimitStatus(status)) {
    return 'Online service is temporarily unavailable due to high traffic. Please try again in a few minutes.'
  }
  const joined = errors.join('; ')
  if (joined.includes('Failed to fetch') || joined.includes('network error') || joined.includes('ENOTFOUND')) {
    return 'Could not reach the online music service. Check your internet connection.'
  }
  return 'Search is temporarily unavailable. Please try again later.'
}

async function fetchWithFallback(path) {
  const errors = []
  let lastStatus = 0
  for (const base of BASE_URLS) {
    try {
      const url = `${base}${path}`
      const res = await fetch(url)
      if (!res.ok) {
        lastStatus = res.status
        if (isRateLimitStatus(res.status)) {
          errors.push(`${base} — rate limited`)
          continue
        }
        errors.push(`${base} returned ${res.status}`)
        continue
      }
      const body = await res.json()
      if (!body?.success || !body?.data) {
        errors.push(`${base} returned invalid data`)
        continue
      }
      return { data: body.data, proxyUsed: base }
    } catch (err) {
      errors.push(`${base} — ${err.message || 'network error'}`)
    }
  }
  return { data: null, error: getUserFriendlyError(errors, lastStatus), proxyUsed: null }
}

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
  if (!query?.trim()) return { success: false, data: [], error: null, proxyUsed: null }
  const { data, error, proxyUsed } = await fetchWithFallback(`/search/songs?query=${encodeURIComponent(query.trim())}&limit=${limit}`)
  if (!data) return { success: false, data: [], error: error || 'Search unavailable', proxyUsed: null }
  const rawTracks = data.results || []
  const tracks = rawTracks.map(buildOnlineTrack)
  const seenIds = new Set()
  const seenTitles = new Set()
  const deduped = tracks.filter(t => {
    if (seenIds.has(t.id)) return false
    seenIds.add(t.id)
    const titleKey = (t.title || '').toLowerCase().trim()
    if (seenTitles.has(titleKey)) return false
    seenTitles.add(titleKey)
    return true
  })
  return { success: true, data: deduped, error: null, proxyUsed }
}

const TRENDING_SEEDS = [
  'trending songs', 'viral hits', 'top charts', 'new releases',
  'trending english', 'trending hindi', 'trending punjabi',
  'today\'s hits', 'popular songs', 'trending 2025',
  'top 50', 'global hits', 'indie trending',
]

export async function getRecommendations() {
  const chosen = [...TRENDING_SEEDS].sort(() => Math.random() - 0.5).slice(0, 3)
  const results = await Promise.allSettled(
    chosen.map(q => searchOnlineSongs(q, 3))
  )
  const all = []
  let lastError = null
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.success) {
      all.push(...r.value.data)
    } else if (r.status === 'fulfilled' && r.value.error) {
      lastError = r.value.error
    }
  }
  if (all.length === 0) {
    return { success: false, data: [], error: lastError || 'Recommendations unavailable', proxyUsed: null }
  }
  const seen = new Set()
  const deduped = all.filter(t => {
    const key = (t.title || '').toLowerCase().trim()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).slice(0, 5)
  return { success: true, data: deduped, error: null, proxyUsed: results.find(r => r.status === 'fulfilled' && r.value.proxyUsed)?.value?.proxyUsed || null }
}

export async function getRelatedSongs(track, limit = 5) {
  if (!track || track._source !== 'online') return { success: false, data: [], error: null, proxyUsed: null }
  const artistName = track.artist?.split(',')[0]?.trim()
  if (!artistName) return { success: false, data: [], error: null, proxyUsed: null }

  const { data, error, proxyUsed } = await fetchWithFallback(`/search/songs?query=${encodeURIComponent(artistName)}&limit=15`)
  if (!data) return { success: false, data: [], error: error || 'Unable to load related songs', proxyUsed: null }

  const currentTitle = track.title?.toLowerCase() || ''
  const rawTracks = data.results || []
  const related = rawTracks
    .filter(s => s.name?.toLowerCase() !== currentTitle)
    .slice(0, limit + 5)
    .map(buildOnlineTrack)
  const seenIds = new Set()
  const seenTitles = new Set()
  const deduped = related.filter(t => {
    if (seenIds.has(t.id)) return false
    seenIds.add(t.id)
    const titleKey = (t.title || '').toLowerCase().trim()
    if (seenTitles.has(titleKey)) return false
    seenTitles.add(titleKey)
    return true
  }).slice(0, limit)
  return { success: true, data: deduped, error: null, proxyUsed }
}

export async function getOnlineSongDetails(id) {
  const { data, error } = await fetchWithFallback(`/songs/${encodeURIComponent(id)}`)
  if (!data) return { success: false, data: null, error: error || 'Unable to fetch song details', proxyUsed: null }
  return { success: true, data: buildOnlineTrack(data), error: null, proxyUsed: null }
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
