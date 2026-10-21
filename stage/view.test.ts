import { beforeEach, describe, expect, it, vi } from 'vitest'
import { showStageFor, stageView } from './view'

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

describe('showStageFor', () => {
  beforeEach(() => stageView.reset())

  it('is visible while any owner is on, hidden when all are off', () => {
    const hero = {}
    const backdrop = {}
    showStageFor(hero, true)
    expect(stageView.get().visible).toBe(true)
    showStageFor(backdrop, true)
    showStageFor(hero, false)
    expect(stageView.get().visible).toBe(true)
    showStageFor(backdrop, false)
    expect(stageView.get().visible).toBe(false)
  })

  it('treats repeated calls for the same owner as one source', () => {
    const a = {}
    showStageFor(a, true)
    showStageFor(a, true)
    showStageFor(a, false)
    expect(stageView.get().visible).toBe(false)
  })
})
