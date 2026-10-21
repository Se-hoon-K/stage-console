import { render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import NotFound from './not-found'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

afterEach(() => vi.restoreAllMocks())

it('says there is no signal and leads back to the stage', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null) // jsdom has no 2D canvas
  render(<NotFound />)
  expect(screen.getByRole('heading', { level: 1, name: 'No signal' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Return to stage' })).toHaveAttribute('href', '/')
})
