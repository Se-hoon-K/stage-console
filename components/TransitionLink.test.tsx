import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { closeShutter, isTransitioning, openShutter } from '@/lib/transition'
import { TransitionLink } from './TransitionLink'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/lib/transition', () => ({ closeShutter: vi.fn(() => Promise.resolve()), openShutter: vi.fn(), isTransitioning: vi.fn(() => false) }))

const stop = (e: Event) => e.preventDefault()

describe('TransitionLink', () => {
  beforeEach(() => {
    push.mockClear()
    vi.mocked(closeShutter).mockClear()
    vi.mocked(openShutter).mockClear()
    vi.mocked(isTransitioning).mockReturnValue(false)
    document.addEventListener('click', stop) // bubble phase: React's handler has already run; this just stops jsdom navigating
  })
  afterEach(() => document.removeEventListener('click', stop))

  it('closes the shutter, then navigates', async () => {
    render(<TransitionLink href="/events/night-signal">Night Signal</TransitionLink>)
    const link = screen.getByRole('link', { name: 'Night Signal' })
    const notPrevented = fireEvent.click(link, { button: 0 })
    expect(notPrevented).toBe(false)
    await waitFor(() => expect(push).toHaveBeenCalledWith('/events/night-signal'))
    expect(closeShutter).toHaveBeenCalledTimes(1)
  })

  it.each([{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }])(
    'keeps browser default for modified clicks %o',
    (mods) => {
      render(<TransitionLink href="/events/night-signal">Go</TransitionLink>)
      fireEvent.click(screen.getByRole('link', { name: 'Go' }), { button: 0, ...mods })
      expect(closeShutter).not.toHaveBeenCalled()
      expect(push).not.toHaveBeenCalled()
    },
  )

  it('keeps browser default for target=_blank', () => {
    render(
      <TransitionLink href="/events/night-signal" target="_blank">
        New tab
      </TransitionLink>,
    )
    fireEvent.click(screen.getByRole('link', { name: 'New tab' }), { button: 0 })
    expect(push).not.toHaveBeenCalled()
  })

  it('leaves same-page anchors to the page', () => {
    render(<TransitionLink href="/#cue-3">Work</TransitionLink>)
    fireEvent.click(screen.getByRole('link', { name: 'Work' }), { button: 0 })
    expect(closeShutter).not.toHaveBeenCalled()
  })

  it('ignores clicks while a transition is in flight', () => {
    vi.mocked(isTransitioning).mockReturnValue(true)
    render(<TransitionLink href="/events/night-signal">Busy</TransitionLink>)
    fireEvent.click(screen.getByRole('link', { name: 'Busy' }), { button: 0 })
    expect(closeShutter).not.toHaveBeenCalled()
    expect(push).not.toHaveBeenCalled()
  })

  it('lifts the shutter if navigation throws', async () => {
    push.mockImplementationOnce(() => {
      throw new Error('nav failed')
    })
    render(<TransitionLink href="/events/night-signal">Boom</TransitionLink>)
    fireEvent.click(screen.getByRole('link', { name: 'Boom' }), { button: 0 })
    await waitFor(() => expect(openShutter).toHaveBeenCalledTimes(1))
  })
})
