import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContactBlock, formatCityTime } from './ContactBlock'

describe('formatCityTime', () => {
  it('formats 24 h local time in the given zone', () => {
    expect(formatCityTime(new Date('2026-01-15T00:30:00Z'), 'Australia/Melbourne')).toBe('11:30')
    expect(formatCityTime(new Date('2026-07-15T13:05:00Z'), 'Australia/Melbourne')).toBe('23:05')
  })
})

describe('ContactBlock', () => {
  it('offers the email once to assistive tech and a booking link', () => {
    render(<ContactBlock />)
    const email = screen.getByRole('link', { name: 'Email hello@example.com' })
    expect(email).toHaveAttribute('href', 'mailto:hello@example.com')
    // Name comes from text content (contains the visible email), not an aria-label that diverges from it.
    expect(email).not.toHaveAttribute('aria-label')
    expect(screen.getByRole('link', { name: 'Book a show' })).toHaveAttribute('href', expect.stringContaining('mailto:hello@example.com'))
  })
})
