import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gsap } from '@/lib/gsap'
import { closeShutter, isTransitioning, openShutter } from './transition'

vi.mock('@/lib/gsap')

describe('shutter', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="shutter"></div>'
    openShutter() // resets the module's "closed" flag so tests don't depend on order
    vi.mocked(gsap.fromTo).mockReset()
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('closes with an animation and resolves when it completes', async () => {
    vi.mocked(gsap.fromTo).mockImplementation(((_t: unknown, _f: unknown, to: { onComplete?: () => void }) => {
      to.onComplete?.()
    }) as never)
    await expect(closeShutter()).resolves.toBeUndefined()
    expect(gsap.fromTo).toHaveBeenCalledTimes(1)
  })

  it('resolves via the timeout when the tween never completes', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(gsap.fromTo).mockImplementation((() => {}) as never)
      let done = false
      void closeShutter().then(() => (done = true))
      await vi.advanceTimersByTimeAsync(799)
      expect(done).toBe(false)
      await vi.advanceTimersByTimeAsync(1)
      expect(done).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('lifts the shutter by itself after 4 s if nobody opened it', async () => {
    vi.useFakeTimers()
    try {
      vi.mocked(gsap.fromTo).mockImplementation((() => {}) as never)
      void closeShutter()
      expect(isTransitioning()).toBe(true)
      await vi.advanceTimersByTimeAsync(4000)
      expect(isTransitioning()).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not open on first load (nothing was closed)', () => {
    openShutter()
    expect(gsap.fromTo).not.toHaveBeenCalled()
  })

  it('opens after a close', async () => {
    vi.mocked(gsap.fromTo).mockImplementation(((_t: unknown, _f: unknown, to: { onComplete?: () => void }) => {
      to.onComplete?.()
    }) as never)
    await closeShutter()
    openShutter()
    expect(gsap.fromTo).toHaveBeenCalledTimes(2)
  })

  it('skips the animation under reduced motion', async () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({ matches: true } as MediaQueryList)
    await closeShutter()
    expect(gsap.fromTo).not.toHaveBeenCalled()
  })
})
