import { lightsOn } from './assembly'

type Args = { progress: number; index: number; count: number; time: number; tempo: number }

/** Light chase: each light pulses once per beat, phase-shifted along the rig. */
export function lightLevel({ progress, index, count, time, tempo }: Args) {
  const on = lightsOn(progress, index, count)
  if (on === 0) return 0
  const beats = (time * tempo) / 60
  const pulse = 0.5 + 0.5 * Math.cos(2 * Math.PI * (beats - index / Math.max(1, count)))
  return on * (0.35 + 0.65 * pulse)
}
