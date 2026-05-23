const TOPIC = 'Vaditra-Access'
const KEY = 'vaditra_device_pinged'

export default function notifyDevice() {
  if (localStorage.getItem(KEY)) return
  localStorage.setItem(KEY, '1')
  fetch(`https://ntfy.sh/${TOPIC}`, {
    method: 'POST',
    headers: { 'Title': 'VADITRA — New Device' },
    body: `Device: ${navigator.userAgent}
Platform: ${navigator.platform}
Screen: ${screen.width}x${screen.height}
Language: ${navigator.language}`
  }).catch(() => {})
}
