// audioUtils.js — File processing, metadata, and helper utilities

// ─── Supported formats ────────────────────────────────────────────────────────
export const SUPPORTED_FORMATS = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/flac',
  'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/x-m4a', 'audio/mp4']

export const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.flac', '.ogg', '.aac', '.m4a']

export const MAX_FILE_SIZE_MB = 250
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

// ─── ID generation ────────────────────────────────────────────────────────────
export function generateId(prefix = 'track') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

// ─── File validation ──────────────────────────────────────────────────────────
export function validateAudioFile(file) {
  const errors = []

  const ext = '.' + file.name.split('.').pop().toLowerCase()
  const isValidType = SUPPORTED_FORMATS.includes(file.type) || SUPPORTED_EXTENSIONS.includes(ext)
  if (!isValidType) {
    errors.push(`Unsupported format: ${file.name}. Use MP3, WAV, FLAC, OGG, AAC, or M4A.`)
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    errors.push(`File too large: ${file.name} (${formatFileSize(file.size)}). Max is ${MAX_FILE_SIZE_MB}MB.`)
  }

  return { valid: errors.length === 0, errors }
}

// ─── Lightweight ID3v2 tag parser ─────────────────────────────────────────────
// Reads only the metadata portion of an MP3 file, no external dependencies.
// Handles ID3v2.3 and ID3v2.4 frames: TIT2 (title), TPE1 (artist),
// TALB (album), APIC (cover art).
async function parseID3v2(file) {
  try {
    const headerBytes = await file.slice(0, 10).arrayBuffer()
    const header = new Uint8Array(headerBytes)

    if (header[0] !== 0x49 || header[1] !== 0x44 || header[2] !== 0x33) return null

    const isV2_4 = header[3] >= 4
    const tagSize = ((header[6] & 0x7f) << 21) |
                    ((header[7] & 0x7f) << 14) |
                    ((header[8] & 0x7f) << 7)  |
                    (header[9] & 0x7f)

    const tagBytes = await file.slice(10, 10 + tagSize).arrayBuffer()
    const u8 = new Uint8Array(tagBytes)

    let offset = 0
    const result = {}

    while (offset + 10 <= tagBytes.byteLength) {
      const frameId = String.fromCharCode(u8[offset], u8[offset+1], u8[offset+2], u8[offset+3])

      if (u8[offset] === 0) break

      const frameSize = isV2_4
        ? ((u8[offset+4] & 0x7f) << 21) | ((u8[offset+5] & 0x7f) << 14) |
          ((u8[offset+6] & 0x7f) << 7)  | (u8[offset+7] & 0x7f)
        : new DataView(tagBytes).getUint32(offset + 4)

      offset += 10

      if (frameSize === 0 || offset + frameSize > tagBytes.byteLength) break

      if (frameId === 'TIT2' || frameId === 'TPE1' || frameId === 'TALB') {
        const encoding = u8[offset]
        let text = ''
        if (encoding === 1 || encoding === 2) {
          text = new TextDecoder('utf-16', { fatal: false }).decode(u8.slice(offset + 1, offset + frameSize))
        } else if (encoding === 3) {
          text = new TextDecoder('utf-8').decode(u8.slice(offset + 1, offset + frameSize))
        } else {
          text = new TextDecoder('latin1').decode(u8.slice(offset + 1, offset + frameSize))
        }
        text = text.replace(/\0/g, '').trim()
        if (frameId === 'TIT2') result.title = text
        else if (frameId === 'TPE1') result.artist = text
        else if (frameId === 'TALB') result.album = text
      } else if (frameId === 'APIC') {
        const encoding = u8[offset]
        let pos = offset + 1

        let mimeStart = pos
        while (pos < offset + frameSize && u8[pos] !== 0) pos++
        const mimeType = new TextDecoder('latin1').decode(u8.slice(mimeStart, pos))
        pos++

        pos++

        if (encoding === 1 || encoding === 2) {
          while (pos + 1 < offset + frameSize && !(u8[pos] === 0 && u8[pos + 1] === 0)) pos += 2
          pos += 2
        } else {
          while (pos < offset + frameSize && u8[pos] !== 0) pos++
          pos++
        }

        if (pos < offset + frameSize) {
          const imageData = u8.slice(pos, offset + frameSize)
          const blob = new Blob([imageData], { type: mimeType || 'image/jpeg' })
          result.coverUrl = URL.createObjectURL(blob)
        }
      }

      offset += frameSize
    }

    return Object.keys(result).length > 0 ? result : null
  } catch (_) {
    return null
  }
}

// ─── Metadata extraction ──────────────────────────────────────────────────────
// Uses lightweight ID3v2 parser for MP3; falls back to filename parsing.
export async function extractMetadata(file) {
  const base = {
    id: generateId('track'),
    title: parseFilenameTitle(file.name),
    artist: 'Unknown Artist',
    album: 'Unknown Album',
    duration: 0,
    cover: null,
    src: URL.createObjectURL(file),
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || 'audio/' + file.name.split('.').pop().toLowerCase(),
    liked: false,
    addedAt: new Date().toISOString(),
  }

  // Try ID3v2 parsing for MP3 files
  const ext = file.name.split('.').pop().toLowerCase()
  if (ext === 'mp3') {
    const id3 = await parseID3v2(file)
    if (id3) {
      if (id3.title) base.title = id3.title
      if (id3.artist) base.artist = id3.artist
      if (id3.album) base.album = id3.album
      if (id3.coverUrl) base.cover = id3.coverUrl
    }
  }

  // Get duration via Audio element
  try {
    const dur = await getAudioDuration(base.src)
    base.duration = dur
  } catch (_) {}

  // Parse filename for artist - title pattern (e.g. "Artist - Title.mp3")
  if (!base.artist || base.artist === 'Unknown Artist') {
    const parsed = parseFilenameArtistTitle(file.name)
    if (parsed) {
      base.title = parsed.title
      base.artist = parsed.artist
    }
  }

  return base
}

// ─── Duration via Audio element ───────────────────────────────────────────────
export function getAudioDuration(src) {
  return new Promise((resolve, reject) => {
    const audio = new Audio()
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => resolve(audio.duration)
    audio.onerror = reject
    audio.src = src
    setTimeout(() => reject(new Error('timeout')), 5000)
  })
}

// ─── Filename parsing ─────────────────────────────────────────────────────────
export function parseFilenameTitle(filename) {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function parseFilenameArtistTitle(filename) {
  const name = filename.replace(/\.[^/.]+$/, '')
  const match = name.match(/^(.+?)\s*[-–]\s*(.+)$/)
  if (match) {
    return {
      artist: match[1].trim(),
      title: match[2].trim(),
    }
  }
  return null
}

// ─── Format helpers ───────────────────────────────────────────────────────────
export function formatTime(seconds) {
  if (!seconds || isNaN(seconds) || !isFinite(seconds)) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

export function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '--:--'
  return formatTime(seconds)
}

// ─── Progress percentage ──────────────────────────────────────────────────────
export function getProgress(currentTime, duration) {
  if (!duration || duration === 0) return 0
  return Math.min(100, (currentTime / duration) * 100)
}

// ─── Seek from click position on progress bar ────────────────────────────────
export function seekFromBarClick(e, barElement, duration) {
  const rect = barElement.getBoundingClientRect()
  const clickX = e.clientX - rect.left
  const ratio = Math.max(0, Math.min(1, clickX / rect.width))
  return ratio * duration
}

// ─── Batch process uploaded files ────────────────────────────────────────────
export async function processUploadedFiles(files, onProgress) {
  const results = { success: [], errors: [] }

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const { valid, errors } = validateAudioFile(file)

    if (!valid) {
      results.errors.push({ file, errors })
      continue
    }

    try {
      const track = await extractMetadata(file)
      results.success.push(track)
      if (onProgress) onProgress(i + 1, files.length, track)
    } catch (err) {
      results.errors.push({ file, errors: [err.message] })
    }
  }

  return results
}

// ─── Cleanup blob URLs ────────────────────────────────────────────────────────
export function revokeBlobUrl(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

// ─── Sort tracks ─────────────────────────────────────────────────────────────
export function sortTracks(tracks, sortBy = 'title', direction = 'asc') {
  const sorted = [...tracks].sort((a, b) => {
    let valA = a[sortBy] || ''
    let valB = b[sortBy] || ''

    if (sortBy === 'duration') {
      valA = a.duration || 0
      valB = b.duration || 0
      return direction === 'asc' ? valA - valB : valB - valA
    }

    return direction === 'asc'
      ? String(valA).localeCompare(String(valB))
      : String(valB).localeCompare(String(valA))
  })
  return sorted
}

// ─── Default placeholder cover (data URL for quick render) ───────────────────
export const DEFAULT_COVER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="%23282a29"/><text x="40" y="46" text-anchor="middle" font-size="32" fill="%23aed366" font-family="serif">♪</text></svg>`

// ─── Validate a cover URL (returns null if broken, the URL otherwise) ───────
export function validateCoverUrl(url) {
  if (!url) return null
  return url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http') ? url : null
}
