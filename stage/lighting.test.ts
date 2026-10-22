import { describe, expect, it } from 'vitest'
import { beamAim, fixtureHsl, headAngles, lightLevel } from './lighting'

describe('lightLevel', () => {
  const base = { index: 0, count: 8, time: 0, tempo: 120 }

  it('is dark before the lights switch on', () => {
    expect(lightLevel({ ...base, progress: 0.3 })).toBe(0)
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

describe('beamAim', () => {
  const base = { index: 0, count: 8, time: 0, reduced: false }

  it('fans out at the start of the show: outer beams lean outward', () => {
    const left = beamAim({ ...base, show: 0, index: 0 })
    const right = beamAim({ ...base, show: 0, index: 7 })
    expect(left.pan).toBeLessThan(0)
    expect(right.pan).toBeGreaterThan(0)
  })

  it('crosses in the middle: outer beams lean inward', () => {
    const left = beamAim({ ...base, show: 0.5, index: 0 })
    const right = beamAim({ ...base, show: 0.5, index: 7 })
    expect(left.pan).toBeGreaterThan(0)
    expect(right.pan).toBeLessThan(0)
  })

  it('punches to centre at the end: every beam converges (small pan) and tilts toward the audience', () => {
    for (let i = 0; i < 8; i++) {
      const a = beamAim({ ...base, show: 1, index: i })
      expect(Math.abs(a.pan)).toBeLessThan(0.15)
      expect(a.tilt).toBeGreaterThan(0.2)
    }
  })

  it('stays put under reduced motion (no time sway)', () => {
    const a = beamAim({ ...base, show: 1, reduced: true, time: 0 })
    const b = beamAim({ ...base, show: 1, reduced: true, time: 3.7 })
    expect(b).toEqual(a)
  })

  it('stays within ±0.6 rad', () => {
    for (let s = 0; s <= 1; s += 0.1)
      for (let i = 0; i < 8; i++)
        for (let t = 0; t < 4; t += 0.5) {
          const a = beamAim({ ...base, show: s, index: i, time: t })
          expect(Math.abs(a.pan)).toBeLessThanOrEqual(0.6)
          expect(Math.abs(a.tilt)).toBeLessThanOrEqual(0.6)
        }
  })
})

describe('headAngles', () => {
  // Beam direction from the beam's own Euler (x = -tilt, z = pan, XYZ order) applied to -y.
  const beamDir = (pan: number, tilt: number) => [Math.sin(pan), -Math.cos(pan) * Math.cos(tilt), Math.cos(pan) * Math.sin(tilt)]
  // Hung head: lens on +y, flipped upside down, tilted by `tilt` about x, then panned by `yaw` about world y.
  const headDir = ({ yaw, tilt }: { yaw: number; tilt: number }) => [
    Math.sin(tilt) * Math.sin(yaw),
    -Math.cos(tilt),
    Math.sin(tilt) * Math.cos(yaw),
  ]

  it('points the head where the beam points', () => {
    for (const [pan, tilt] of [
      [0, 0.1],
      [0.45, 0.1],
      [-0.4, 0.2],
      [0.07, 0.35],
      [0.3, -0.05],
    ]) {
      const want = beamDir(pan, tilt)
      headDir(headAngles({ pan, tilt })).forEach((v, k) => expect(v).toBeCloseTo(want[k]))
    }
  })
})

describe('fixtureHsl', () => {
  it('makes floor pars warm white with a hint of the hue', () => {
    const [, s, l] = fixtureHsl(8, true)
    expect(s).toBeLessThan(0.3)
    expect(l).toBeGreaterThanOrEqual(0.85)
  })

  it('keeps hung heads coloured but softer than full saturation', () => {
    const [, s] = fixtureHsl(8, false)
    expect(s).toBeGreaterThanOrEqual(0.6)
    expect(s).toBeLessThanOrEqual(0.85)
  })

  it('follows the console hue for both', () => {
    expect(fixtureHsl(200, false)[0]).not.toBe(fixtureHsl(8, false)[0])
    expect(fixtureHsl(200, true)[0]).not.toBe(fixtureHsl(8, true)[0])
  })
})
