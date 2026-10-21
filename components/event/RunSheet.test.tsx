import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { RunSheet } from './RunSheet'

it('lists cues in order and marks the first as current', () => {
  render(
    <RunSheet
      items={[
        { time: '16:00', cue: 'Doors' },
        { time: '18:30', cue: 'Act 1' },
      ]}
    />,
  )
  const items = screen.getByRole('list', { name: 'Run sheet' }).querySelectorAll('li')
  expect(items).toHaveLength(2)
  expect(items[0]).toHaveTextContent('16:00')
  expect(items[0]).toHaveTextContent('Doors')
  expect(items[0]).toHaveAttribute('aria-current', 'step')
  expect(items[1]).not.toHaveAttribute('aria-current')
})
