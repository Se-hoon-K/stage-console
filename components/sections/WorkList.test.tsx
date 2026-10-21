import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { shows } from '@/content/shows'
import { WorkList } from './WorkList'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

it('lists every show with its facts', () => {
  render(<WorkList shows={shows} />)
  expect(screen.getAllByRole('listitem')).toHaveLength(shows.length)
  expect(screen.getByRole('heading', { name: 'Night Signal' })).toBeInTheDocument()
  expect(screen.getByText('18,000 cap.')).toBeInTheDocument()
})

it('powers on the hovered row and previews its stage', () => {
  const { container } = render(<WorkList shows={shows} />)
  const row = screen.getAllByRole('listitem')[1]
  fireEvent.pointerEnter(row)
  expect(row).toHaveAttribute('data-active', 'true')
  expect(container.querySelector('.work-preview svg')).not.toBeNull()
  fireEvent.pointerLeave(container.firstElementChild!)
  expect(row).toHaveAttribute('data-active', 'false')
})

it('links every row to its event page', () => {
  render(<WorkList shows={shows} />)
  expect(screen.getByRole('link', { name: 'Night Signal' })).toHaveAttribute('href', '/events/night-signal')
  expect(screen.getAllByRole('link')).toHaveLength(shows.length)
})

it('lights the row when its link gets keyboard focus, and clears when focus leaves the list', () => {
  const { container } = render(<WorkList shows={shows} />)
  const link = screen.getByRole('link', { name: 'Low Frequency' })
  fireEvent.focusIn(link) // React 17+ listens on focusin/focusout
  const row = link.closest('li')!
  expect(row).toHaveAttribute('data-active', 'true')
  expect(container.querySelector('.work-preview svg')).not.toBeNull()
  fireEvent.focusOut(link, { relatedTarget: document.body })
  expect(row).toHaveAttribute('data-active', 'false')
})
