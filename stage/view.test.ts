import { beforeEach, describe, expect, it, vi } from 'vitest'
import { stageView } from './view'

describe('stageView', () => {
  beforeEach(() => stageView.reset())

  it('starts on the hero seed, not ready, visible, progress 0', () => {
    expect(stageView.get()).toEqual({ seed: 7, progress: 0, visible: true, webglReady: false })
  })

  it('clamps progress to 0–1 and ignores NaN', () => {
    stageView.set({ progress: 1.4 })
    expect(stageView.get().progress).toBe(1)
    stageView.set({ progress: -0.2 })
    expect(stageView.get().progress).toBe(0)
    stageView.set({ progress: 0.5 })
    stageView.set({ progress: Number.NaN })
    expect(stageView.get().progress).toBe(0.5)
  })

  it('notifies only when something changed', () => {
    const fn = vi.fn()
    const off = stageView.subscribe(fn)
    stageView.set({ visible: true })
    expect(fn).not.toHaveBeenCalled()
    stageView.set({ visible: false, seed: 9 })
    expect(fn).toHaveBeenCalledTimes(1)
    off()
  })
})
