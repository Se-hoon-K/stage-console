import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollTrigger } from '@/lib/gsap'
import { stageView } from '@/stage/view'
import { HeroStage } from './HeroStage'

vi.mock('@/lib/gsap')

function renderInSection() {
  return render(
    <section id="cue-1">
      <h1>We build the show.</h1>
      <HeroStage />
    </section>,
  )
}

describe('HeroStage', () => {
  beforeEach(() => {
    stageView.reset()
    vi.mocked(ScrollTrigger.create).mockClear()
    vi.mocked(window.matchMedia).mockClear()
  })

  afterEach(() =>
    vi.mocked(window.matchMedia).mockImplementation(
      (q: string) =>
        ({
          matches: false,
          media: q,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    ),
  )

  it('pins the hero and drives stage progress from scroll', () => {
    renderInSection()
    expect(ScrollTrigger.create).toHaveBeenCalledTimes(1)
    const config = vi.mocked(ScrollTrigger.create).mock.calls[0][0] as unknown as {
      pin: boolean
      end: string
      onUpdate: (self: { progress: number }) => void
    }
    expect(config.pin).toBe(true)
    expect(config.end).toBe('+=300%')
    config.onUpdate({ progress: 0.64 })
    expect(stageView.get().progress).toBe(0.64)
  })

  it('syncs progress from the trigger on mount and hides the stage on unmount', () => {
    stageView.set({ progress: 1 })
    const { unmount } = renderInSection()
    expect(stageView.get().progress).toBe(0)
    expect(stageView.get().visible).toBe(true)
    unmount()
    expect(stageView.get().visible).toBe(false)
  })

  it('hides the stage on unmount under reduced motion too', () => {
    vi.mocked(window.matchMedia).mockImplementation(
      (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }) as unknown as MediaQueryList,
    )
    renderInSection().unmount()
    expect(stageView.get().visible).toBe(false)
  })

  it('shows the assembled stage without pinning under reduced motion', () => {
    vi.mocked(window.matchMedia).mockImplementation(
      (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }) as unknown as MediaQueryList,
    )
    renderInSection()
    expect(ScrollTrigger.create).not.toHaveBeenCalled()
    expect(stageView.get().progress).toBe(1)
    expect(screen.getByText(/SHOW 100%/)).toBeInTheDocument()
  })

  it('keeps the SVG stage visible until WebGL is ready, and describes it for screen readers', () => {
    const { container } = renderInSection()
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('class')).toContain('opacity-100')
    expect(screen.getByText(/stage .* assembles as you scroll/i)).toHaveClass('sr-only')
  })
})
