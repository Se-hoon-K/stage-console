import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { whenStageCanMount } from './Scene'

describe('whenStageCanMount', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.stubGlobal('requestIdleCallback', (cb: IdleRequestCallback) => window.setTimeout(() => cb({} as IdleDeadline), 0))
    vi.stubGlobal('cancelIdleCallback', (id: number) => window.clearTimeout(id))
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('mounts on the first interaction, once', () => {
    const fn = vi.fn()
    whenStageCanMount(fn)
    vi.advanceTimersByTime(1000)
    expect(fn).not.toHaveBeenCalled()
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('pointerdown'))
    vi.advanceTimersByTime(10_000)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('falls back to a timer that starts at the load event', () => {
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading')
    const fn = vi.fn()
    whenStageCanMount(fn, 4000)
    vi.advanceTimersByTime(10_000)
    expect(fn).not.toHaveBeenCalled()
    window.dispatchEvent(new Event('load'))
    vi.advanceTimersByTime(3999)
    expect(fn).not.toHaveBeenCalled()
    vi.advanceTimersByTime(10)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does nothing after cancel', () => {
    const fn = vi.fn()
    whenStageCanMount(fn)()
    window.dispatchEvent(new Event('keydown'))
    vi.advanceTimersByTime(10_000)
    expect(fn).not.toHaveBeenCalled()
  })
})
