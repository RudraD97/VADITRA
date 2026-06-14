import { registerPlugin, PluginListenerHandle } from '@capacitor/core'

export interface MediaSessionPlugin {
  setActive(options: { active: boolean }): Promise<void>
  setPlaying(options: { playing: boolean }): Promise<void>
  setMetadata(options: { title: string; artist: string; album: string }): Promise<void>
  requestAudioFocus(): Promise<void>
  abandonAudioFocus(): Promise<void>
  release(): Promise<void>
  addListener(
    eventName: 'play' | 'pause' | 'next' | 'previous' | 'seekTo' | 'audioFocusChange',
    listener: (data: { position?: number; focusChange?: number }) => void
  ): Promise<PluginListenerHandle>
  removeAllListeners(): Promise<void>
}

const MediaSessionNative = registerPlugin<MediaSessionPlugin>('MediaSessionPlugin')

export default MediaSessionNative
