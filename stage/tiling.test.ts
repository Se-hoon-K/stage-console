import { describe, expect, it } from 'vitest'
import type { Part } from './generateStage'
import { hangs, tileCount, trussTiles } from './tiling'

describe('tileCount', () => {
  it('covers the length with whole segments, never fewer than one', () => {
    expect(tileCount(6, 2)).toBe(3)
    expect(tileCount(6.9, 2)).toBe(3)
    expect(tileCount(7.1, 2)).toBe(4)
    expect(tileCount(0.5, 2)).toBe(1)
  })
})

describe('trussTiles', () => {
  it('lays a tower end to end up y, from its base', () => {
    const tiles = trussTiles([0.4, 7, 0.4], 2)
    expect(tiles.map((t) => t.axis)).toEqual([1, 1, 1, 1])
    expect(tiles[0].length).toBeCloseTo(1.75)
    expect(tiles.map((t) => t.start[1])).toEqual([-3.5, -1.75, 0, 1.75])
    expect(tiles.every((t) => t.start[0] === 0 && t.start[2] === 0)).toBe(true)
  })

  it('runs a span along x', () => {
    const tiles = trussTiles([1.9, 0.4, 0.4], 2)
    expect(tiles).toEqual([{ axis: 0, length: 1.9, start: [-0.95, 0, 0] }])
  })
})

describe('hangs', () => {
  const box = (id: string, x: number, y: number, order: number): Part => ({
    id,
    kind: 'speaker',
    position: [x, y, 4],
    rotation: [0, 0, 0],
    size: [1, 0.5, 0.8],
    exploded: [x, 8, 1],
    order,
  })

  it('merges each side’s stacked boxes into one hang that flies in with its top box', () => {
    const out = hangs([box('l0', -6, 6, 0.5), box('l1', -6, 5.45, 0.52), box('r0', 6, 6, 0.6), box('r1', 6, 5.45, 0.62)])
    expect(out).toHaveLength(2)
    const [l, r] = out
    expect(l.position[0]).toBe(-6)
    expect(l.position[1]).toBeCloseTo((6.25 + 5.2) / 2)
    expect(l.size[1]).toBeCloseTo(1.05)
    expect(l.order).toBe(0.5)
    expect(l.exploded).toEqual([-6, 8, 1])
    expect(r.position[0]).toBe(6)
    expect(r.order).toBe(0.6)
  })
})
