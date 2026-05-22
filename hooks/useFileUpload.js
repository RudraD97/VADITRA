// useFileUpload.js — Drag & drop + file input upload handling
// Usage: const { uploads, isDragging, handleFiles, ... } = useFileUpload()

import { useState, useCallback, useRef } from 'react'
import { processUploadedFiles, validateAudioFile, formatFileSize } from '../utils/audioUtils'
import { saveAudioFile } from '../utils/indexedDB'
import usePlayerStore from '../store/playerStore'

export const UPLOAD_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  DONE: 'done',
  ERROR: 'error',
}

export function useFileUpload() {
  const [uploads, setUploads] = useState([])   // [{ id, file, status, progress, track, error }]
  const [isDragging, setIsDragging] = useState(false)
  const [dragCounter, setDragCounter] = useState(0)
  const addToLibrary = usePlayerStore(s => s.addToLibrary)
  const fileInputRef = useRef(null)

  // ─── Update a single upload entry ──────────────────────────────────────────
  const updateUpload = useCallback((id, patch) => {
    setUploads(prev => prev.map(u => u.id === id ? { ...u, ...patch } : u))
  }, [])

  // ─── Process a list of File objects ────────────────────────────────────────
  const handleFiles = useCallback(async (files) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)

    // Create pending entries immediately for UI feedback
    const pendingEntries = fileArray.map(file => {
      const { valid, errors } = validateAudioFile(file)
      return {
        id: `upload_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        file,
        name: file.name,
        size: formatFileSize(file.size),
        status: valid ? UPLOAD_STATUS.PENDING : UPLOAD_STATUS.ERROR,
        progress: 0,
        track: null,
        error: valid ? null : errors[0],
      }
    })

    setUploads(prev => [...pendingEntries, ...prev])

    // Process valid files
    for (const entry of pendingEntries) {
      if (entry.status === UPLOAD_STATUS.ERROR) continue

      updateUpload(entry.id, { status: UPLOAD_STATUS.PROCESSING, progress: 10 })

      try {
        // Simulate progress while extracting metadata
        updateUpload(entry.id, { progress: 40 })

        const result = await processUploadedFiles([entry.file])

        if (result.success.length > 0) {
          const track = result.success[0]
          updateUpload(entry.id, {
            status: UPLOAD_STATUS.DONE,
            progress: 100,
            track,
          })
          addToLibrary(track)
          saveAudioFile(track.id, entry.file)
        } else {
          updateUpload(entry.id, {
            status: UPLOAD_STATUS.ERROR,
            error: result.errors[0]?.errors[0] || 'Failed to process file',
          })
        }
      } catch (err) {
        updateUpload(entry.id, {
          status: UPLOAD_STATUS.ERROR,
          error: err.message || 'Unknown error',
        })
      }
    }
  }, [updateUpload, addToLibrary])

  // ─── Remove an upload entry ─────────────────────────────────────────────────
  const removeUpload = useCallback((id) => {
    setUploads(prev => prev.filter(u => u.id !== id))
  }, [])

  const clearAll = useCallback(() => setUploads([]), [])
  const clearCompleted = useCallback(() => {
    setUploads(prev => prev.filter(u => u.status !== UPLOAD_STATUS.DONE))
  }, [])

  // ─── Drag event handlers ────────────────────────────────────────────────────
  const onDragEnter = useCallback((e) => {
    e.preventDefault()
    setDragCounter(c => c + 1)
    setIsDragging(true)
  }, [])

  const onDragLeave = useCallback((e) => {
    e.preventDefault()
    setDragCounter(c => {
      const next = c - 1
      if (next <= 0) setIsDragging(false)
      return Math.max(0, next)
    })
  }, [])

  const onDragOver = useCallback((e) => {
    e.preventDefault()
  }, [])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setIsDragging(false)
    setDragCounter(0)
    const files = e.dataTransfer?.files
    if (files) handleFiles(files)
  }, [handleFiles])

  // ─── File input ─────────────────────────────────────────────────────────────
  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const onFileInputChange = useCallback((e) => {
    if (e.target.files) handleFiles(e.target.files)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }, [handleFiles])

  // ─── Stats ──────────────────────────────────────────────────────────────────
  const stats = {
    total: uploads.length,
    done: uploads.filter(u => u.status === UPLOAD_STATUS.DONE).length,
    pending: uploads.filter(u => u.status === UPLOAD_STATUS.PENDING || u.status === UPLOAD_STATUS.PROCESSING).length,
    errors: uploads.filter(u => u.status === UPLOAD_STATUS.ERROR).length,
  }

  return {
    uploads,
    isDragging,
    stats,
    handleFiles,
    removeUpload,
    clearAll,
    clearCompleted,
    // Drag handlers (spread onto the drop zone element)
    dragHandlers: { onDragEnter, onDragLeave, onDragOver, onDrop },
    // File input
    fileInputRef,
    openFilePicker,
    onFileInputChange,
  }
}

export default useFileUpload
