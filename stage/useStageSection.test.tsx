import { render, screen } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { stageView } from './view'
import { useStageSection } from './useStageSection'

vi.mock('@/lib/gsap')

function Probe({ seed, end }: { seed: number; end?: string }) {
  const ref = useRef<HTMLElement>(null)
  useStageSection(ref, { seed, end })
  return <section ref={ref} data-testid="s" />
}

const defaultMatchMedia = (q: string) =>
  ({ matches: false, media: q, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() }) as unknown as MediaQueryList

describe('useStageSection', () => {
  beforeEach(() => {
    stageView.reset()
    vi.mocked(ScrollTrigger.create).mockClear()
  })
  afterEach(() => vi.mocked(window.matchMedia).mockImplementation(defaultMatchMedia))

  it('sets the seed and pins the section with the given scroll length', () => {
    render(<Probe seed={314} end="+=120%" />)
    expect(stageView.get().seed).toBe(314)
    const config = vi.mocked(ScrollTrigger.create).mock.calls[0][0] as unknown as { pin: boolean; end: string }
    expect(config.pin).toBe(true)
    expect(config.end).toBe('+=120%')
  })

  it('syncs progress from the trigger on mount, so a remount never shows a stale stage', () => {
    stageView.set({ progress: 1 })
    render(<Probe seed={7} />)
    expect(stageView.get().progress).toBe(0)
  })

  it('mirrors scroll progress into stageView and the --assembly CSS variable', () => {
    const { getByTestId } = render(<Probe seed={7} />)
    const config = vi.mocked(ScrollTrigger.create).mock.calls[0][0] as unknown as { onUpdate: (s: { progress: number }) => void }
    config.onUpdate({ progress: 0.4 })
    expect(stageView.get().progress).toBe(0.4)
    expect(getByTestId('s').style.getPropertyValue('--assembly')).toBe('0.4')
  })

  it('shows the assembled stage without pinning or moving the title under reduced motion', () => {
    vi.mocked(window.matchMedia).mockImplementation((q: string) => ({ ...defaultMatchMedia(q), matches: q.includes('reduce') }) as MediaQueryList)
    const { getByTestId } = render(<Probe seed={7} />)
    expect(ScrollTrigger.create).not.toHaveBeenCalled()
    expect(stageView.get().progress).toBe(1)
    expect(getByTestId('s').style.getPropertyValue('--assembly')).toBe('')
  })

  it('hands the canvas back on unmount', () => {
    const { unmount } = render(<Probe seed={7} />)
    stageView.set({ visible: true })
    unmount()
    expect(stageView.get().visible).toBe(false)
  })

  it('reverts GSAP DOM changes when the tree is replaced (layout cleanup, before React places the next route)', () => {
    const revert = vi.mocked(gsap.context).mock.results.at(-1)?.value.revert as ReturnType<typeof vi.fn> | undefined
    revert?.mockClear()
    const { rerender } = render(<Probe seed={7} />)
    const ctxRevert = vi.mocked(gsap.context).mock.results.at(-1)!.value.revert as ReturnType<typeof vi.fn>
    ctxRevert.mockClear()
    rerender(<p>next</p>)
    expect(ctxRevert).toHaveBeenCalled()
    expect(screen.getByText('next')).toBeInTheDocument()
  })
})
