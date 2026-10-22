import { lightsOn } from './assembly'

/** Lights above this height (m) hang from the rig; below it they stand on the deck. */
export const HUNG_MIN_HEIGHT = 3

type Args = { progress: number; index: number; count: number; time: number; tempo: number }

/** Light chase: each light pulses once per beat, phase-shifted along the rig. */
export function lightLevel({ progress, index, count, time, tempo }: Args) {
  const on = lightsOn(progress, index, count)
  if (on === 0) return 0
  const beats = (time * tempo) / 60
  const pulse = 0.5 + 0.5 * Math.cos(2 * Math.PI * (beats - index / Math.max(1, count)))
  return on * (0.35 + 0.65 * pulse)
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * Moving-head looks keyed to show progress: fan out → cross → centre punch, blended, with a slow
 * sway on top (none under reduced motion). pan leans along x, tilt toward the audience; radians.
 */
export function beamAim({ show, index, count, time, reduced }: { show: number; index: number; count: number; time: number; reduced: boolean }) {
  const x = count > 1 ? index / (count - 1) - 0.5 : 0 // -0.5 … 0.5 across the rig
  const fan = { pan: x * 0.9, tilt: 0.1 }
  const cross = { pan: -x * 0.8, tilt: 0.2 }
  const punch = { pan: -x * 0.15, tilt: 0.35 }
  const a = smooth(0.25, 0.45, show)
  const b = smooth(0.65, 0.85, show)
  let pan = fan.pan + (cross.pan - fan.pan) * a
  let tilt = fan.tilt + (cross.tilt - fan.tilt) * a
  pan += (punch.pan - pan) * b
  tilt += (punch.tilt - tilt) * b
  if (!reduced) {
    const sway = 1 - b // calm once punched in
    pan += Math.sin(time * 0.6 + index) * 0.08 * sway
    tilt += Math.sin(time * 0.45 + index * 1.7) * 0.05 * sway
  }
  return { pan, tilt }
}

/**
 * A hung moving head (lens on its +y, flipped upside down) aimed along the beam's (pan, tilt):
 * `yaw` turns the yoke about world y, `tilt` the head about its own x. Same direction, real-fixture axes.
 */
export function headAngles({ pan, tilt }: { pan: number; tilt: number }) {
  return {
    yaw: Math.atan2(Math.sin(pan), Math.cos(pan) * Math.sin(tilt)),
    tilt: Math.acos(Math.min(1, Math.cos(pan) * Math.cos(tilt))),
  }
}

/** HSL (0–1) for a fixture: hung heads follow the console hue, softened; floor pars are warm white with a hint of it. */
export function fixtureHsl(hue: number, floor: boolean): [number, number, number] {
  return floor ? [hue / 360, 0.25, 0.88] : [hue / 360, 0.75, 0.6]
}
