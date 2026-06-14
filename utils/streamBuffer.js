const partialDownloads = new Map()

export function clearPartialDownload(trackId) {
  partialDownloads.delete(trackId)
}

export function hasPartialDownload(trackId) {
  return partialDownloads.has(trackId)
}

export async function cacheOnlineTrackLocally(track, onReady) {
  if (!track?.src) return

  const existing = partialDownloads.get(track.id)
  const chunks = existing ? [...existing.chunks] : []
  let downloaded = existing?.downloaded || 0

  try {
    const headers = {}
    if (downloaded > 0) {
      headers['Range'] = `bytes=${downloaded}-`
    }

    const response = await fetch(track.src, { headers })

    // If Range wasn't accepted, retry full download from scratch
    if (downloaded > 0 && response.status !== 206) {
      partialDownloads.delete(track.id)
      chunks.length = 0
      downloaded = 0
      const retryResponse = await fetch(track.src)
      if (!retryResponse.ok) return
      const reader = retryResponse.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        downloaded += value.length
      }
    } else {
      if (!response.ok) return
      const reader = response.body.getReader()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        downloaded += value.length
      }
    }

    partialDownloads.delete(track.id)
    const contentType = response.headers.get('content-type') || 'audio/mpeg'
    const blob = new Blob(chunks, { type: contentType })
    const url = URL.createObjectURL(blob)
    onReady(url)
  } catch {
    if (chunks.length > 0) {
      partialDownloads.set(track.id, { chunks, downloaded })
    }
  }
}
