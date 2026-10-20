import type Lenis from 'lenis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { isGliding, scrollToCue, setLenis } from './scroll'

describe('scrollToCue', () => {
  beforeEach(() => {
    document.body.innerHTML = '<section id="cue-3" tabindex="-1"></section>'
    vi.mocked(Element.prototype.scrollIntoView).mockClear()
  })
  afterEach(() => {
    setLenis(null)
    window.dispatchEvent(new Event('scrollend'))
  })

  it('returns false and does nothing when the section is not on this page', () => {
    expect(scrollToCue(9)).toBe(false)
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })

  it('falls back to smooth native scrolling and moves focus to the section', () => {
    const el = document.getElementById('cue-3')!
    expect(scrollToCue(3)).toBe(true)
    expect(el.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth' })
    expect(document.activeElement).toBe(el)
  })

  it('jumps instantly when reduced motion is preferred', () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({ matches: true } as MediaQueryList)
    scrollToCue(3)
    expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'auto' })
  })

  it('delegates to Lenis when it is running', () => {
    const scrollTo = vi.fn()
    setLenis({ scrollTo } as unknown as Lenis)
    scrollToCue(3)
    expect(scrollTo).toHaveBeenCalledWith(document.getElementById('cue-3'), expect.objectContaining({ duration: 1.2 }))
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })

  it('reports a glide until Lenis completes', () => {
    let done: (() => void) | undefined
    setLenis({ scrollTo: (_el: unknown, opts: { onComplete: () => void }) => (done = opts.onComplete) } as unknown as Lenis)
    scrollToCue(3)
    expect(isGliding()).toBe(true)
    done!()
    expect(isGliding()).toBe(false)
  })

  it('reports a native smooth glide until scrollend', () => {
    scrollToCue(3)
    expect(isGliding()).toBe(true)
    window.dispatchEvent(new Event('scrollend'))
    expect(isGliding()).toBe(false)
  })

  it('does not report a glide for an instant reduced-motion jump', () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({ matches: true } as MediaQueryList)
    scrollToCue(3)
    expect(isGliding()).toBe(false)
  })

  it('ends a glide after a safety timeout if no end event arrives', () => {
    vi.useFakeTimers()
    scrollToCue(3)
    vi.advanceTimersByTime(1600)
    expect(isGliding()).toBe(false)
    vi.useRealTimers()
  })

  it('does not start a glide when the section is missing', () => {
    scrollToCue(9)
    expect(isGliding()).toBe(false)
  })
})
