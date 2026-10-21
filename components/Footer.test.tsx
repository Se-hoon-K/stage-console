import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { agency } from '@/content/agency'
import { modelCredits } from '@/content/credits'
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

  it('credits every third-party model with its licence', () => {
    render(<Footer />)
    for (const m of modelCredits) {
      expect(screen.getByRole('link', { name: m.title })).toHaveAttribute('href', m.url)
      expect(screen.getByRole('contentinfo')).toHaveTextContent(`${m.title} by ${m.author} (${m.licence})`)
    }
    expect(screen.getAllByRole('link', { name: 'CC BY 4.0' })).toHaveLength(modelCredits.length)
  })
})
