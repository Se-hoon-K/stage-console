import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { HeaderNav } from './HeaderNav'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

it('has a phone menu toggle that reveals the cue links', () => {
  render(<HeaderNav />)
  const toggle = screen.getByRole('button', { name: 'Menu' })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute('href', '/#cue-3')
})

it('closes on Escape and returns focus to the Menu button', () => {
  render(<HeaderNav />)
  const toggle = screen.getByRole('button', { name: 'Menu' })
  fireEvent.click(toggle)
  fireEvent.keyDown(document, { key: 'Escape' })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(toggle).toHaveFocus()
})
