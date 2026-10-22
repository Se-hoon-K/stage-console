import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stageView } from '@/stage/view'
import { WebGLBoundary } from './WebGLBoundary'

function Boom(): never {
  throw new Error('shader failed')
}

describe('WebGLBoundary', () => {
  beforeEach(() => {
    stageView.reset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('renders nothing and flags WebGL as not ready when the child throws', () => {
    stageView.set({ webglReady: true })
    const { container } = render(
      <WebGLBoundary>
        <Boom />
      </WebGLBoundary>,
    )
    expect(container).toBeEmptyDOMElement()
    expect(stageView.get().webglReady).toBe(false)
  })

  it('logs the cause and retries once after a second', () => {
    vi.useFakeTimers()
    let offline = true
    function Flaky() {
      if (offline) throw new Error('chunk 404')
      return <p>stage</p>
    }
    const { queryByText } = render(
      <WebGLBoundary>
        <Flaky />
      </WebGLBoundary>,
    )
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('[stage]'), expect.any(Error))
    expect(queryByText('stage')).toBeNull()
    offline = false // the network recovers before the retry
    act(() => vi.advanceTimersByTime(1000))
    expect(queryByText('stage')).toBeInTheDocument()
    vi.useRealTimers()
  })

  it('gives up after the retry fails too', () => {
    vi.useFakeTimers()
    const { container } = render(
      <WebGLBoundary>
        <Boom />
      </WebGLBoundary>,
    )
    act(() => vi.advanceTimersByTime(1000))
    act(() => vi.advanceTimersByTime(5000))
    expect(container).toBeEmptyDOMElement()
    expect(stageView.get().webglReady).toBe(false)
    vi.useRealTimers()
  })

  it('renders children normally', () => {
    const { getByText } = render(<WebGLBoundary>ok</WebGLBoundary>)
    expect(getByText('ok')).toBeInTheDocument()
  })
})
