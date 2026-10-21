import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { scrollToCue } from '@/lib/scroll'
import { HeaderNav } from './HeaderNav'

const pathname = vi.hoisted(() => ({ value: '/events/x' }))
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => pathname.value }))
vi.mock('@/lib/scroll', () => ({ scrollToCue: vi.fn(() => true) }))

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

it('on the home page a cue link scrolls instead of navigating', () => {
  pathname.value = '/'
  render(<HeaderNav />)
  fireEvent.click(screen.getByRole('link', { name: 'Work' }))
  expect(scrollToCue).toHaveBeenCalledWith(3)
  pathname.value = '/events/x'
})
