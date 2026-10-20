import { describe, expect, it } from 'vitest'
import { generateStage } from './generateStage'
import { toElevation } from './elevation'

describe('toElevation', () => {
  const stage = generateStage(7)
  const el = toElevation(stage)

  it('draws one rect per non-light part and one circle per light', () => {
    const lights = stage.parts.filter((p) => p.kind === 'light').length
    expect(el.lights).toHaveLength(lights)
    expect(el.rects).toHaveLength(stage.parts.length - lights)
  })

  it('keeps every shape inside the viewBox', () => {
    const [x0, y0, w, h] = el.viewBox.split(' ').map(Number)
    for (const r of el.rects) {
      expect(r.x).toBeGreaterThanOrEqual(x0 - 1e-9)
      expect(r.y).toBeGreaterThanOrEqual(y0 - 1e-9)
      expect(r.x + r.w).toBeLessThanOrEqual(x0 + w + 1e-9)
      expect(r.y + r.h).toBeLessThanOrEqual(y0 + h + 1e-9)
    }
  })

  it('puts the deck on the ground line (y = 0 is the floor)', () => {
    const deck = el.rects.find((r) => r.id === 'deck-main')!
    expect(deck.y + deck.h).toBeCloseTo(0)
  })
})
