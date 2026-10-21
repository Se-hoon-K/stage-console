import { describe, expect, it } from 'vitest'
import { ASSEMBLY_END, LIGHTS_END, assembledCount, lightsOn, partOffset, showProgress, snapEase, stagePhase } from './assembly'
import { generateStage } from './generateStage'

describe('snapEase', () => {
  it('starts at 0, ends at 1 and overshoots only a little', () => {
    expect(snapEase(0)).toBeCloseTo(0)
    expect(snapEase(1)).toBeCloseTo(1)
    let max = 0
    for (let t = 0; t <= 1; t += 0.01) max = Math.max(max, snapEase(t))
    expect(max).toBeGreaterThan(1)
    expect(max).toBeLessThanOrEqual(1.1)
  })
})

describe('partOffset', () => {
  it('is fully exploded before the part starts and in place after it ends', () => {
    expect(partOffset(0, 0.5)).toBe(1)
    expect(partOffset(0.5 * 0.35 + 0.1, 0.5)).toBeCloseTo(0)
    expect(partOffset(1, 0.5)).toBeCloseTo(0)
  })

  it('finishes every part by the end of assembly', () => {
    expect(partOffset(ASSEMBLY_END, 1)).toBeCloseTo(0)
  })
})

describe('lightsOn', () => {
  it('keeps every light off during assembly and all on at the end', () => {
    for (let i = 0; i < 10; i++) {
      expect(lightsOn(ASSEMBLY_END - 0.01, i, 10)).toBe(0)
      expect(lightsOn(1, i, 10)).toBe(1)
    }
  })

  it('switches lights on one after another', () => {
    expect(lightsOn(0.5, 0, 10)).toBe(1)
    expect(lightsOn(0.5, 9, 10)).toBe(0)
  })
})

describe('assembledCount', () => {
  it('counts parts in place', () => {
    const stage = generateStage(7)
    expect(assembledCount(stage, 0)).toBe(0)
    expect(assembledCount(stage, 1)).toBe(stage.parts.length)
  })
})

describe('phases', () => {
  it('finishes the lights by LIGHTS_END', () => {
    for (let i = 0; i < 10; i++) expect(lightsOn(LIGHTS_END, i, 10)).toBe(1)
  })

  it('maps the show phase to 0–1 after the lights are up', () => {
    expect(showProgress(0)).toBe(0)
    expect(showProgress(LIGHTS_END)).toBe(0)
    expect(showProgress((LIGHTS_END + 1) / 2)).toBeCloseTo(0.5)
    expect(showProgress(1)).toBe(1)
  })

  it('names the phase for the HUD', () => {
    expect(stagePhase(0)).toBe('ASSEMBLY')
    expect(stagePhase(ASSEMBLY_END - 0.01)).toBe('ASSEMBLY')
    expect(stagePhase(ASSEMBLY_END + 0.01)).toBe('LIGHTS')
    expect(stagePhase(LIGHTS_END + 0.01)).toBe('SHOW')
    expect(stagePhase(1)).toBe('SHOW')
  })
})
