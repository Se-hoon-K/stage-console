import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { StatCounter } from './StatCounter'

vi.mock('@/lib/gsap')

it('renders the final, formatted value (server/no-JS/reduced motion see the real number)', () => {
  render(<StatCounter value={18000} />)
  expect(screen.getByText('18,000')).toBeInTheDocument()
})

it('renders the unit next to the number', () => {
  render(<StatCounter value={38} unit="km" />)
  expect(screen.getByText('38')).toBeInTheDocument()
  expect(screen.getByText('km')).toBeInTheDocument()
})
