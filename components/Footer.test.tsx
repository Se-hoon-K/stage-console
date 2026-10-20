import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { agency } from '@/content/agency'
import { Footer } from './Footer'

describe('Footer credits', () => {
  const original = { ...agency.credits }
  afterEach(() => Object.assign(agency.credits, original))

  it('states the agency is fictional and credits the author', () => {
    render(<Footer />)
    expect(screen.getByRole('contentinfo')).toHaveTextContent(/is a fictional agency/)
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Sehoon Ko')
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/Se-hoon-K')
    expect(screen.getByRole('link', { name: 'Source code' })).toHaveAttribute('href', 'https://github.com/Se-hoon-K/stage-console')
  })

  it('omits links that are not filled in yet', () => {
    agency.credits.linkedin = undefined
    render(<Footer />)
    expect(screen.queryByRole('link', { name: 'LinkedIn' })).toBeNull()
  })

  it('renders LinkedIn once it is provided', () => {
    agency.credits.linkedin = 'https://www.linkedin.com/in/example'
    render(<Footer />)
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/example')
  })
})
