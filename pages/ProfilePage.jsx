import React from 'react'

export default function ProfilePage() {
  return (
    <div style={{ animation: 'pageEnter 0.3s ease-out forwards' }}>
      <div className="max-w-3xl mx-auto px-5 pt-6 min-h-[80vh] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6" style={{ background: 'rgba(174,211,102,0.1)' }}>
          <span className="material-symbols-outlined text-[40px] text-primary-fixed-dim" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
        </div>
        <h1 className="text-[22px] font-bold font-syne text-[#e2e3e0] mb-2">Coming Soon</h1>
        <p className="text-[14px] text-on-surface-variant/50 font-inter max-w-xs">Profile, settings, and personalization features are on the way.</p>
      </div>
    </div>
  )
}
