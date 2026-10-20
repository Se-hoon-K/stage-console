import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { agency } from '@/content/agency'
import { ServiceRack } from './ServiceRack'

it('expands a rack unit with its toggle', () => {
  render(<ServiceRack services={agency.services} />)
  const toggles = screen.getAllByRole('button', { name: 'Details' })
  expect(toggles).toHaveLength(agency.services.length)
  const first = toggles[0]
  expect(first).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByText(agency.services[0].details[0])).not.toBeVisible()
  fireEvent.click(first)
  expect(first).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText(agency.services[0].details[0])).toBeVisible()
})
