import { render } from '@testing-library/react'
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

  it('renders children normally', () => {
    const { getByText } = render(<WebGLBoundary>ok</WebGLBoundary>)
    expect(getByText('ok')).toBeInTheDocument()
  })
})
