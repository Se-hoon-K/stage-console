import { afterEach, describe, expect, it, vi } from 'vitest'
import { canUseWebGL, resetWebGLSupportCache } from './support'

describe('canUseWebGL', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetWebGLSupportCache()
  })

  it('is false when no WebGL context can be created', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    expect(canUseWebGL()).toBe(false)
  })

  it('is false when context creation throws', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(canUseWebGL()).toBe(false)
  })

  it('is true when a context exists, and caches the answer', () => {
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({} as unknown as RenderingContext)
    expect(canUseWebGL()).toBe(true)
    expect(canUseWebGL()).toBe(true)
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
