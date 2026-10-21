import type { Part, Vec3 } from './generateStage'

/** Whole segments covering `length` (≥ 1). */
export const tileCount = (length: number, segment: number) => Math.max(1, Math.round(length / segment))

export type Tile = { axis: 0 | 1 | 2; length: number; start: Vec3 }

/** A truss part of `size` cut along its longest side into whole segments; `start` is each segment's low end, relative to the part centre. */
export function trussTiles(size: Vec3, segment: number): Tile[] {
  const axis = (size[0] >= size[1] && size[0] >= size[2] ? 0 : size[1] >= size[2] ? 1 : 2) as Tile['axis']
  const count = tileCount(size[axis], segment)
  const length = size[axis] / count
  return Array.from({ length: count }, (_, i) => {
    const start: Vec3 = [0, 0, 0]
    start[axis] = -size[axis] / 2 + i * length
    return { axis, length, start }
  })
}

/** Speaker boxes stacked per side → one hang per side (union bounds), flying in with its first box. */
export function hangs(speakers: Part[]): Part[] {
  const sides = new Map<number, Part[]>()
  for (const p of speakers) {
    const side = Math.sign(p.position[0])
    sides.set(side, [...(sides.get(side) ?? []), p])
  }
  return [...sides.values()].map((boxes) => {
    const lo = [0, 1, 2].map((k) => Math.min(...boxes.map((b) => b.position[k] - b.size[k] / 2)))
    const hi = [0, 1, 2].map((k) => Math.max(...boxes.map((b) => b.position[k] + b.size[k] / 2)))
    const first = boxes.reduce((a, b) => (b.order < a.order ? b : a))
    return {
      ...first,
      id: `hang-${first.id}`,
      position: [0, 1, 2].map((k) => (lo[k] + hi[k]) / 2) as Vec3,
      size: [0, 1, 2].map((k) => hi[k] - lo[k]) as Vec3,
    }
  })
}
