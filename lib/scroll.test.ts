import type Lenis from 'lenis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { scrollToCue, setLenis } from './scroll'

describe('scrollToCue', () => {
  beforeEach(() => {
    document.body.innerHTML = '<section id="cue-3" tabindex="-1"></section>'
    vi.mocked(Element.prototype.scrollIntoView).mockClear()
  })
  afterEach(() => setLenis(null))

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
    expect(scrollTo).toHaveBeenCalledWith(document.getElementById('cue-3'), { duration: 1.2 })
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })
})
