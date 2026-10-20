import { describe, expect, it } from 'vitest'
import { clamp, dragToValue, snapToDetent, stepValue } from './controls'

describe('control math', () => {
  it('clamps', () => {
    expect(clamp(5, 0, 1)).toBe(1)
    expect(clamp(-1, 0, 1)).toBe(0)
  })

  it('snaps to the nearest detent without float noise', () => {
    expect(snapToDetent(127, 60, 180, 12)).toBe(130)
    expect(snapToDetent(0.34, 0, 1, 10)).toBe(0.3)
    expect(snapToDetent(999, 60, 180, 12)).toBe(180)
  })

  it('steps by one detent, or five with a multiplier', () => {
    expect(stepValue(120, 60, 180, 12, 1)).toBe(130)
    expect(stepValue(120, 60, 180, 12, 1, 5)).toBe(170)
    expect(stepValue(0.3, 0, 1, 10, -1)).toBe(0.2)
  })

  it('never steps past the ends', () => {
    expect(stepValue(180, 60, 180, 12, 1)).toBe(180)
    expect(stepValue(60, 60, 180, 12, -1, 5)).toBe(60)
  })

  it('maps vertical drag to value (up = more) and clamps', () => {
    expect(dragToValue(0.5, -100, 0, 1)).toBe(1)
    expect(dragToValue(0.5, 50, 0, 1)).toBe(0.25)
    expect(dragToValue(0.5, -10_000, 0, 1)).toBe(1)
  })
})
