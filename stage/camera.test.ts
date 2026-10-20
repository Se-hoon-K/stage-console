import { describe, expect, it } from 'vitest'
import { fitDistance } from './camera'

describe('fitDistance', () => {
  it('leaves desktop unchanged (fits well inside the 19 m dolly end)', () => {
    expect(fitDistance(14, 35, 16 / 9)).toBeLessThanOrEqual(19)
  })
  it('pulls the camera back on a phone', () => {
    expect(fitDistance(14, 35, 390 / 844)).toBeGreaterThan(30)
  })
})
