import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import Home from './page'

vi.mock('@/lib/gsap')
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

it('renders five cue sections, one h1, each labelled by its heading', () => {
  const { container } = render(<Home />)
  const sections = container.querySelectorAll('section[data-cue]')
  expect(sections).toHaveLength(5)
  sections.forEach((section, i) => {
    expect(section.id).toBe(`cue-${i + 1}`)
    expect(section.getAttribute('tabindex')).toBe('-1')
    expect(section.getAttribute('aria-labelledby')).toBe(`cue-${i + 1}-title`)
  })
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('We build the show.')
})
