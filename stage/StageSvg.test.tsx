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

it('draws itself in as a blueprint only when asked', () => {
  const stage = generateStage(7)
  const { container, rerender } = render(<StageSvg stage={stage} hue={200} />)
  expect(container.querySelector('svg')).not.toHaveClass('stage-blueprint')
  expect(container.querySelector('.blueprint-grid')).toBeNull()
  rerender(<StageSvg stage={stage} hue={200} draw />)
  expect(container.querySelector('svg')).toHaveClass('stage-blueprint')
  expect(container.querySelector('.blueprint-grid')).not.toBeNull()
  const parts = container.querySelectorAll('rect:not(.blueprint-grid)')
  expect(parts[0].getAttribute('pathLength')).toBe('1')
  expect((parts[2] as SVGElement).style.getPropertyValue('--i')).toBe('2')
  for (const c of container.querySelectorAll('circle')) {
    expect(c.getAttribute('fill')).toBe('none')
    expect(c.getAttribute('stroke')).toBe('var(--color-ink)')
  }
})
