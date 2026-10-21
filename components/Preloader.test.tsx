import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetWebGLSupportCache } from '@/webgl/support'
import { Preloader, preloadPercent } from './Preloader'

vi.mock('@/lib/gsap')

describe('preloadPercent', () => {
  it('counts with time, waits at 90 until ready, never takes longer than 3 s', () => {
    expect(preloadPercent(0, false)).toBe(0)
    expect(preloadPercent(600, true)).toBe(50)
    expect(preloadPercent(1200, false)).toBe(90)
    expect(preloadPercent(1200, true)).toBe(100)
    expect(preloadPercent(3000, false)).toBe(100)
  })
})

describe('Preloader', () => {
  beforeEach(() => {
    // jsdom has no WebGL; stub so canUseWebGL() is quiet and false.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    resetWebGLSupportCache()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    try {
      sessionStorage.clear()
    } catch {}
  })

  it('shows on the first visit of a session', () => {
    render(<Preloader />)
    expect(screen.getByRole('status')).toHaveTextContent(/sound check/i)
  })

  it('stays away when this session already saw it', async () => {
    sessionStorage.setItem('stage-console:preloaded', '1')
    render(<Preloader />)
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
  })

  it('still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => render(<Preloader />)).not.toThrow()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('unmounts even if the exit tween never completes', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    render(<Preloader />)
    act(() => {
      vi.advanceTimersByTime(3200)
    })
    expect(screen.getByRole('status')).toBeInTheDocument()
    act(() => {
      vi.advanceTimersByTime(1500)
    })
    expect(screen.queryByRole('status')).toBeNull()
  })
})
