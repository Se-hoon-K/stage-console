import type { Stage } from './generateStage'

/** Scroll progress 0–1 is cut into three phases: parts fly in, lights come up, then the show runs. */
export const ASSEMBLY_END = 0.45
export const LIGHTS_END = 0.55
/** Pin length in % of the viewport. app/globals.css reserves the same amount in svh. */
export const PIN_LENGTH = 300
const SPREAD = 0.35
const TRAVEL = 0.1
const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

export type StagePhase = 'ASSEMBLY' | 'LIGHTS' | 'SHOW'

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
  const start = ASSEMBLY_END + (LIGHTS_END - ASSEMBLY_END - 0.02) * (index / Math.max(1, count))
  return clamp01((progress - start) / 0.02)
}

export function showProgress(progress: number) {
  return clamp01((progress - LIGHTS_END) / (1 - LIGHTS_END))
}

export function stagePhase(progress: number): StagePhase {
  if (progress < ASSEMBLY_END) return 'ASSEMBLY'
  if (progress < LIGHTS_END) return 'LIGHTS'
  return 'SHOW'
}

export function assembledCount(stage: Stage, progress: number) {
  return stage.parts.filter((p) => Math.abs(partOffset(progress, p.order)) < 0.001).length
}
