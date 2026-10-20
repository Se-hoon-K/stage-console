import { describe, expect, it } from 'vitest'
import { shows } from '@/content/shows'
import { generateStage } from './generateStage'

const SEEDS = [1, 7, 42, 1234, 99999, ...shows.map((s) => s.seed)]

describe('generateStage', () => {
  it('returns the identical stage for the same seed', () => {
    expect(generateStage(7)).toEqual(generateStage(7))
  })

  it('returns different stages for different seeds', () => {
    expect(generateStage(1)).not.toEqual(generateStage(2))
  })

  it.each(SEEDS)('seed %i: no part sits below the floor', (seed) => {
    for (const p of generateStage(seed).parts) {
      expect(p.position[1] - p.size[1] / 2).toBeGreaterThanOrEqual(-1e-9)
    }
  })

  it.each(SEEDS)('seed %i: deck width 8–14 m and 8–24 hung lights', (seed) => {
    const { parts } = generateStage(seed)
    const deck = parts.find((p) => p.kind === 'deck')!
    expect(deck.size[0]).toBeGreaterThanOrEqual(8)
    expect(deck.size[0]).toBeLessThanOrEqual(14)
    const hung = parts.filter((p) => p.kind === 'light' && p.position[1] > 3)
    expect(hung.length).toBeGreaterThanOrEqual(8)
    expect(hung.length).toBeLessThanOrEqual(24)
  })

  it.each(SEEDS)('seed %i: assembly order follows deck → truss → speakers → lights → screen', (seed) => {
    const { parts } = generateStage(seed)
    const rank = { deck: 0, truss: 1, speaker: 2, light: 3, screen: 4 } as const
    for (let i = 1; i < parts.length; i++) {
      expect(parts[i].order).toBeGreaterThanOrEqual(parts[i - 1].order)
      expect(rank[parts[i].kind]).toBeGreaterThanOrEqual(rank[parts[i - 1].kind])
    }
    expect(parts[0].order).toBe(0)
    expect(parts[parts.length - 1].order).toBe(1)
  })

  it('gives every part a unique id and a non-zero exploded offset', () => {
    const { parts } = generateStage(7)
    expect(new Set(parts.map((p) => p.id)).size).toBe(parts.length)
    for (const p of parts) expect(Math.hypot(...p.exploded)).toBeGreaterThan(1)
  })
})
