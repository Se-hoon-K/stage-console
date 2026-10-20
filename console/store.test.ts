import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULTS, consoleStore } from './store'

describe('consoleStore', () => {
  beforeEach(() => consoleStore.reset())

  it('starts from the defaults with sound off', () => {
    expect(consoleStore.get()).toEqual(DEFAULTS)
    expect(consoleStore.get().soundOn).toBe(false)
  })

  it('updates values and notifies subscribers once per change', () => {
    const fn = vi.fn()
    consoleStore.subscribe(fn)
    consoleStore.set({ master: 0.5, hue: 200 })
    expect(consoleStore.get().master).toBe(0.5)
    expect(consoleStore.get().hue).toBe(200)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does not notify when nothing changed', () => {
    const fn = vi.fn()
    consoleStore.subscribe(fn)
    consoleStore.set({ tempo: DEFAULTS.tempo })
    expect(fn).not.toHaveBeenCalled()
  })

  it('clamps numbers into their range', () => {
    consoleStore.set({ master: 2, tempo: 10, hue: -5, activeCue: 9 })
    expect(consoleStore.get()).toMatchObject({ master: 1, tempo: 60, hue: 0, activeCue: 5 })
  })

  it('ignores NaN and keeps the previous value', () => {
    consoleStore.set({ fog: Number.NaN })
    expect(consoleStore.get().fog).toBe(DEFAULTS.fog)
  })

  it('setValue writes a single numeric key', () => {
    consoleStore.setValue('intensity', 0.25)
    expect(consoleStore.get().intensity).toBe(0.25)
  })

  it('stops notifying after unsubscribe', () => {
    const fn = vi.fn()
    const off = consoleStore.subscribe(fn)
    off()
    consoleStore.set({ master: 0.1 })
    expect(fn).not.toHaveBeenCalled()
  })
})
