import { describe, expect, it } from 'vitest'
import { lightLevel } from './lighting'

describe('lightLevel', () => {
  const base = { index: 0, count: 8, time: 0, tempo: 120 }

  it('is dark before the lights switch on', () => {
    expect(lightLevel({ ...base, progress: 0.5 })).toBe(0)
  })

  it('stays between 0.35 and 1 once on', () => {
    for (let t = 0; t < 2; t += 0.05) {
      const v = lightLevel({ ...base, progress: 1, time: t })
      expect(v).toBeGreaterThanOrEqual(0.35 - 1e-9)
      expect(v).toBeLessThanOrEqual(1 + 1e-9)
    }
  })

  it('repeats once per beat', () => {
    const a = lightLevel({ ...base, progress: 1, time: 0.1 })
    const b = lightLevel({ ...base, progress: 1, time: 0.1 + 60 / 120 })
    expect(b).toBeCloseTo(a)
  })

  it('travels across the rig (neighbours are out of phase)', () => {
    const a = lightLevel({ ...base, progress: 1, index: 0 })
    const b = lightLevel({ ...base, progress: 1, index: 4 })
    expect(a).not.toBeCloseTo(b)
  })
})
