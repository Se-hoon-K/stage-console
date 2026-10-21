import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { closeShutter } from '@/lib/transition'
import { TransitionLink } from './TransitionLink'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/lib/transition', () => ({ closeShutter: vi.fn(() => Promise.resolve()), openShutter: vi.fn() }))

describe('TransitionLink', () => {
  beforeEach(() => {
    push.mockClear()
    vi.mocked(closeShutter).mockClear()
  })

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
})
