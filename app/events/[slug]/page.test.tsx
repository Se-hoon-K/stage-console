import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EventPage, { formatShowDate, generateStaticParams } from './page'

vi.mock('@/lib/gsap')
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  useRouter: () => ({ push: vi.fn() }),
}))

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

describe('event page', () => {
  it('builds a page per show', () => {
    expect(generateStaticParams()).toEqual(
      expect.arrayContaining([{ slug: 'night-signal' }, { slug: 'daybreak-summit' }]),
    )
  })

  it('formats dates the same everywhere', () => {
    expect(formatShowDate('2026-03-14')).toBe('14 Mar 2026')
  })

  it('renders the featured show: title, spec sheet, stage, run sheet, numbers, next show', async () => {
    render(await EventPage(params('night-signal')))
    expect(screen.getByRole('heading', { level: 1, name: 'Night Signal' })).toBeInTheDocument()
    const specs = screen.getByRole('list', { name: 'Show facts' })
    expect(within(specs).getByText('Docklands Yard')).toBeInTheDocument()
    expect(within(specs).getByText('18,000')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Night Signal stage' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Run sheet' }).querySelectorAll('li')).toHaveLength(5)
    expect(screen.getByText('38')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Harbour Lights/ })).toHaveAttribute('href', '/events/harbour-lights')
  })

  it('omits empty sections for shows without a run sheet or stats', async () => {
    render(await EventPage(params('harbour-lights')))
    expect(screen.queryByRole('list', { name: 'Run sheet' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'By the numbers' })).toBeNull()
  })

  it('wraps from the last show back to the first', async () => {
    render(await EventPage(params('daybreak-summit')))
    expect(screen.getByRole('link', { name: /Night Signal/ })).toHaveAttribute('href', '/events/night-signal')
  })

  it('sends unknown slugs to the 404 page', async () => {
    await expect(EventPage(params('nope'))).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
