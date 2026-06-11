import React, { useRef } from 'react'
import usePlayerStore from '../store/playerStore'
import { useFileUpload, UPLOAD_STATUS } from '../hooks/useFileUpload'

export default function UploadPage() {
  const {
    uploads, isDragging, stats,
    handleFiles, removeUpload, clearAll, clearCompleted,
    dragHandlers, fileInputRef, openFilePicker, onFileInputChange,
  } = useFileUpload()

  const inputRef = useRef(null)

  const handleDropZoneClick = () => {
    inputRef.current?.click()
  }

  const getStatusColor = (status) => {
    switch (status) {
      case UPLOAD_STATUS.DONE: return 'bg-outline/20'
      case UPLOAD_STATUS.ERROR: return 'bg-error/40'
      default: return 'bg-primary-fixed-dim'
    }
  }

  const getStatusText = (entry) => {
    if (entry.status === UPLOAD_STATUS.ERROR) return entry.error || 'Error'
    if (entry.status === UPLOAD_STATUS.DONE) return 'Done'
    return `${Math.floor(entry.progress)}%`
  }

  const getStatusColorText = (status) => {
    if (status === UPLOAD_STATUS.DONE) return 'text-on-surface-variant/60'
    if (status === UPLOAD_STATUS.ERROR) return 'text-error'
    return 'text-primary-fixed-dim'
  }

  return (
    <div style={{ animation: 'pageEnter 0.3s ease-out forwards' }}>

      <main className="pt-6 pb-6 px-5 max-w-3xl mx-auto">

        {/* Page Title */}
        <section className="mb-8">
          <h2 className="text-[28px] font-bold text-on-surface font-syne">Upload</h2>
          <p className="text-on-surface-variant text-[16px] mt-1 font-inter">Distribute your sound to the world.</p>
        </section>

        {/* Drop Zone */}
        <section
          className={`relative cursor-pointer h-[280px] w-full rounded-xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center gap-4 p-6 text-center ${
            isDragging
              ? 'border-primary-fixed-dim bg-surface-container'
              : 'border-outline-variant/30 bg-surface-container-low hover:border-primary-fixed-dim/50 hover:bg-surface-container-low/50'
          }`}
          onClick={handleDropZoneClick}
          {...dragHandlers}
        >
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform duration-300 ${
            isDragging ? 'scale-110 bg-primary-fixed-dim/20' : 'bg-primary-fixed-dim/10'
          }`}>
            <span className="material-symbols-outlined text-[32px]" style={{ color: '#aed366' }}>upload</span>
          </div>
          <div>
            <h3 className="text-[20px] font-semibold text-on-surface font-syne">
              {isDragging ? 'Drop files here' : 'Tap to browse files'}
            </h3>
            <p className="text-on-surface-variant/60 text-[14px] mt-1 font-inter">or drag here</p>
          </div>
          <p className="absolute bottom-6 text-[12px] text-on-surface-variant/40 font-inter">WAV, MP3, FLAC (Max 250MB)</p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.flac,.ogg,.aac,.m4a"
            className="hidden"
            onChange={onFileInputChange}
          />
        </section>

        {/* Upload Queue */}
        {uploads.length > 0 && (
          <section className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[13px] text-on-surface-variant uppercase tracking-[0.1em] font-inter font-medium">
                Uploads ({stats.total})
              </h3>
              <button
                className="text-[13px] text-primary-fixed-dim font-inter hover:underline"
                onClick={clearCompleted}
              >
                Clear completed
              </button>
            </div>

            <div className="space-y-3">
              {uploads.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl flex items-center gap-4 transition-all"
                  style={{
                    background: 'rgba(30, 32, 31, 0.6)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(142, 147, 128, 0.12)',
                  }}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0">
                    {entry.status === UPLOAD_STATUS.DONE ? (
                      <span className="material-symbols-outlined text-primary-fixed-dim text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                    ) : entry.status === UPLOAD_STATUS.ERROR ? (
                      <span className="material-symbols-outlined text-error text-[18px]">error</span>
                    ) : (
                      <span className="material-symbols-outlined text-on-surface-variant/60 text-[18px]">music_note</span>
                    )}
                  </div>

                  {/* File info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between mb-2">
                      <span className="text-[14px] text-on-surface truncate pr-4 font-inter">{entry.name}</span>
                      <span className={`text-[13px] font-inter ${getStatusColorText(entry.status)}`}>
                        {getStatusText(entry)}
                      </span>
                    </div>
                    <div className="w-full h-[3px] bg-surface-container-highest rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${getStatusColor(entry.status)}`}
                        style={{
                          width: `${entry.progress}%`,
                          boxShadow: entry.status === UPLOAD_STATUS.PENDING || entry.status === UPLOAD_STATUS.PROCESSING
                            ? '0 0 8px rgba(174,211,102,0.3)'
                            : 'none',
                        }}
                      />
                    </div>
                  </div>

                  {/* Close button */}
                  <button
                    className="w-8 h-8 flex items-center justify-center text-on-surface-variant/40 hover:text-on-surface transition-colors flex-shrink-0"
                    onClick={() => removeUpload(entry.id)}
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
