import type { PartKind, Stage } from './generateStage'

export type Elevation = {
  viewBox: string
  rects: { id: string; kind: PartKind; x: number; y: number; w: number; h: number }[]
  lights: { id: string; cx: number; cy: number; r: number }[]
}

/** Front elevation of an assembled stage. SVG y grows downwards, so world y is negated; the floor is y = 0. */
export function toElevation(stage: Stage): Elevation {
  const [bw, bh] = stage.bounds
  const pad = 0.5
  const rects: Elevation['rects'] = []
  const lights: Elevation['lights'] = []

  for (const p of stage.parts) {
    const [x, y] = p.position
    const [w, h] = p.size
    if (p.kind === 'light') lights.push({ id: p.id, cx: x, cy: -y, r: Math.max(w, h) / 2 })
    else rects.push({ id: p.id, kind: p.kind, x: x - w / 2, y: -(y + h / 2), w, h })
  }

  return { viewBox: `${-bw / 2 - pad} ${-bh - pad} ${bw + 2 * pad} ${bh + 2 * pad}`, rects, lights }
}
