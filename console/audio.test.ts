import { afterEach, describe, expect, it, vi } from 'vitest'
import { initAudio, playClick, playPad, readLevel } from './audio'

describe('audio engine before start', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reports unsupported when the browser has no AudioContext', async () => {
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('webkitAudioContext', undefined)
    expect(await initAudio()).toBe(false)
  })

  it('ignores pads and clicks, and reads silence, before audio starts', () => {
    expect(() => playPad('kick')).not.toThrow()
    expect(() => playClick()).not.toThrow()
    expect(readLevel()).toBe(0)
  })
})
