import { render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stageView } from './view'
import { useStageBackdrop } from './useStageBackdrop'

let callback: IntersectionObserverCallback
const disconnect = vi.fn()
class IO {
  constructor(cb: IntersectionObserverCallback) {
    callback = cb
  }
  observe() {}
  disconnect = disconnect
}

function Probe() {
  const ref = useRef<HTMLElement>(null)
  useStageBackdrop(ref)
  return <section ref={ref} />
}

describe('useStageBackdrop', () => {
  beforeEach(() => {
    stageView.reset()
    stageView.set({ visible: false })
    vi.stubGlobal('IntersectionObserver', IO)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('keeps the canvas visible while the section is on screen', () => {
    render(<Probe />)
    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(stageView.get().visible).toBe(true)
    callback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(stageView.get().visible).toBe(false)
  })

  it('releases its claim on unmount', () => {
    const { unmount } = render(<Probe />)
    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    unmount()
    expect(disconnect).toHaveBeenCalled()
    expect(stageView.get().visible).toBe(false)
  })
})
