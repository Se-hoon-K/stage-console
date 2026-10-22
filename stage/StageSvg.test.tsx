import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { generateStage } from './generateStage'
import { StageSvg } from './StageSvg'

it('renders a hidden SVG with hung lights in the console hue and floor lights warm white', () => {
  const stage = generateStage(7)
  const { container } = render(<StageSvg stage={stage} hue={200} />)
  const svg = container.querySelector('svg')!
  expect(svg).toHaveAttribute('aria-hidden', 'true')
  const circles = svg.querySelectorAll('circle')
  expect(circles.length).toBe(stage.parts.filter((p) => p.kind === 'light').length)
  const fills = [...circles].map((c) => c.getAttribute('fill'))
  expect(fills).toContain('hsl(200 75% 60%)')
  expect(fills).toContain('hsl(200 25% 88%)')
})
