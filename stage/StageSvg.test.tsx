import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { generateStage } from './generateStage'
import { StageSvg } from './StageSvg'

it('renders a hidden SVG with lights in the console hue', () => {
  const stage = generateStage(7)
  const { container } = render(<StageSvg stage={stage} hue={200} />)
  const svg = container.querySelector('svg')!
  expect(svg).toHaveAttribute('aria-hidden', 'true')
  const circles = svg.querySelectorAll('circle')
  expect(circles.length).toBe(stage.parts.filter((p) => p.kind === 'light').length)
  expect(circles[0].getAttribute('fill')).toBe('hsl(200 100% 60%)')
})
