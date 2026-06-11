let _audio = null

export function setAudioElement(el) {
  _audio = el
}

export function getAudioElement() {
  return _audio
}

export function playSrc(src) {
  if (!_audio || !src) return
  if (_audio.src !== src) {
    _audio.src = src
    _audio.load()
  }
  _audio.play().catch(() => {})
}

export function pauseAudio() {
  if (!_audio) return
  _audio.pause()
}

export function resumeAudio() {
  if (!_audio) return
  _audio.play().catch(() => {})
}
