import type { Stage } from './generateStage'

export const ASSEMBLY_END = 0.8
const SPREAD = 0.65
const TRAVEL = 0.15
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

/** Fast travel, small overshoot, settle (back-out with a gentle constant). */
export function snapEase(t: number) {
  const c1 = 1.2
  const c3 = c1 + 1
  const u = t - 1
  return 1 + c3 * u * u * u + c1 * u * u
}

/** 1 = fully exploded, 0 = in place. */
export function partOffset(progress: number, order: number) {
  const t = clamp01((progress - order * SPREAD) / TRAVEL)
  if (t === 0) return 1
  return 1 - snapEase(t)
}

export function lightsOn(progress: number, index: number, count: number) {
  const start = ASSEMBLY_END + 0.18 * (index / Math.max(1, count))
  return clamp01((progress - start) / 0.02)
}

export function assembledCount(stage: Stage, progress: number) {
  return stage.parts.filter((p) => Math.abs(partOffset(progress, p.order)) < 0.001).length
}
