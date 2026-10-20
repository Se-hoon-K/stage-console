import { describe, expect, it } from 'vitest'
import { shows } from '@/content/shows'
import { generateStage } from './generateStage'

const SEEDS = [1, 7, 42, 1234, 99999, ...shows.map((s) => s.seed)]

const towers = (parts: ReturnType<typeof generateStage>['parts']) =>
  parts.filter((p) => p.id.startsWith('tower-'))

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

  it('does not share rotation arrays between parts', () => {
    const { parts } = generateStage(7)
    expect(parts[0].rotation).not.toBe(parts[1].rotation)
  })

  it.each(SEEDS)('seed %i: 2 or 4 towers', (seed) => {
    expect([2, 4]).toContain(towers(generateStage(seed).parts).length)
  })

  it.each(SEEDS)('seed %i: rear beams exist iff rear towers exist', (seed) => {
    const { parts } = generateStage(seed)
    const rearTowers = towers(parts).filter((p) => p.id.endsWith('-b'))
    const rearBeams = parts.filter((p) => p.id.startsWith('beam-b-'))
    expect(rearBeams.length > 0).toBe(rearTowers.length > 0)
  })

  it.each(SEEDS)('seed %i: a 2-tower stage has no rear hung lights', (seed) => {
    const { parts } = generateStage(seed)
    if (towers(parts).length === 2) {
      expect(parts.filter((p) => p.id.startsWith('light-b-'))).toHaveLength(0)
    }
  })

  it.each(SEEDS)('seed %i: 2–4 floor washes', (seed) => {
    const washes = generateStage(seed).parts.filter((p) => p.id.startsWith('wash-'))
    expect(washes.length).toBeGreaterThanOrEqual(2)
    expect(washes.length).toBeLessThanOrEqual(4)
  })

  it.each(SEEDS)('seed %i: 4–8 speakers per side, equal on both sides', (seed) => {
    const { parts } = generateStage(seed)
    const left = parts.filter((p) => p.id.startsWith('spk-l-')).length
    const right = parts.filter((p) => p.id.startsWith('spk-r-')).length
    expect(left).toBe(right)
    expect(left).toBeGreaterThanOrEqual(4)
    expect(left).toBeLessThanOrEqual(8)
  })

  it.each(SEEDS)('seed %i: exploded offsets rise and move away from centre', (seed) => {
    const { parts } = generateStage(seed)
    for (const p of parts) {
      expect(p.exploded[1]).toBeGreaterThan(0)
      const dot = p.exploded[0] * p.position[0] + p.exploded[2] * p.position[2]
      expect(dot).toBeGreaterThanOrEqual(0)
    }
    for (let i = 1; i < parts.length; i++) {
      expect(parts[i].exploded[1]).toBeGreaterThanOrEqual(parts[i - 1].exploded[1])
    }
  })

  it('covers the optional features across SEEDS', () => {
    const stages = SEEDS.map((s) => generateStage(s))
    const has = (pred: (st: ReturnType<typeof generateStage>) => boolean) => stages.some(pred)
    const lacks = (pred: (st: ReturnType<typeof generateStage>) => boolean) => stages.some((s) => !pred(s))
    const hasPart = (id: string) => (st: ReturnType<typeof generateStage>) => st.parts.some((p) => p.id === id)
    expect(has(hasPart('deck-thrust'))).toBe(true)
    expect(lacks(hasPart('deck-thrust'))).toBe(true)
    expect(has(hasPart('screen'))).toBe(true)
    expect(lacks(hasPart('screen'))).toBe(true)
    expect(has((st) => towers(st.parts).length === 2)).toBe(true)
    expect(has((st) => towers(st.parts).length === 4)).toBe(true)
  })
})
