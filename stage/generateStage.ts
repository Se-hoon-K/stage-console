import { mulberry32 } from './prng'

export type PartKind = 'deck' | 'truss' | 'light' | 'speaker' | 'screen'
export type Vec3 = [number, number, number]
export type Part = {
  id: string
  kind: PartKind
  position: Vec3
  rotation: Vec3
  size: Vec3
  exploded: Vec3
  order: number
}
export type Stage = { seed: number; parts: Part[]; bounds: Vec3 }

type Draft = Omit<Part, 'exploded' | 'order'>

const DECK_H = 1.2
const BEAM = 0.4
const SEGMENT = 2

/** Seed → concert stage. Metres, y up, audience on +z. Same seed, same stage. */
export function generateStage(seed: number): Stage {
  const rand = mulberry32(seed)
  const range = (min: number, max: number) => min + rand() * (max - min)
  const int = (min: number, max: number) => Math.floor(range(min, max + 1))

  const width = range(8, 14)
  const depth = range(6, 8)
  const trussH = range(6, 8)
  const fourTowers = rand() < 0.5
  const thrust = rand() < 0.5
  const hungLights = int(8, 24)
  const washes = int(2, 4)
  const boxesPerSide = int(4, 8)
  const screen = rand() < 0.6

  const frontZ = depth / 2 - BEAM / 2
  const span = width + 2 * BEAM

  const deck: Draft[] = [
    { id: 'deck-main', kind: 'deck', position: [0, DECK_H / 2, 0], rotation: [0, 0, 0], size: [width, DECK_H, depth] },
  ]
  if (thrust) {
    deck.push({ id: 'deck-thrust', kind: 'deck', position: [0, DECK_H / 2, depth / 2 + 1.5], rotation: [0, 0, 0], size: [2, DECK_H, 3] })
  }

  const truss: Draft[] = []
  const towerZs = fourTowers ? [frontZ, -frontZ] : [frontZ]
  for (const z of towerZs) {
    for (const side of [-1, 1]) {
      truss.push({
        id: `tower-${side < 0 ? 'l' : 'r'}-${z > 0 ? 'f' : 'b'}`,
        kind: 'truss',
        position: [side * (width / 2 + BEAM / 2), trussH / 2, z],
        rotation: [0, 0, 0],
        size: [BEAM, trussH, BEAM],
      })
    }
  }
  const segments = Math.ceil(span / SEGMENT)
  const segLen = span / segments
  const beamZs = fourTowers ? [frontZ, -frontZ] : [frontZ]
  for (const z of beamZs) {
    for (let i = 0; i < segments; i++) {
      truss.push({
        id: `beam-${z > 0 ? 'f' : 'b'}-${i}`,
        kind: 'truss',
        position: [-span / 2 + segLen * (i + 0.5), trussH + BEAM / 2, z],
        rotation: [0, 0, 0],
        size: [segLen, BEAM, BEAM],
      })
    }
  }

  const speakers: Draft[] = []
  for (const side of [-1, 1]) {
    for (let i = 0; i < boxesPerSide; i++) {
      speakers.push({
        id: `spk-${side < 0 ? 'l' : 'r'}-${i}`,
        kind: 'speaker',
        position: [side * (width / 2 + 1.4), trussH - 0.6 - i * 0.55, depth / 2],
        rotation: [0, 0, 0],
        size: [1, 0.5, 0.8],
      })
    }
  }

  const lights: Draft[] = []
  const front = fourTowers ? Math.ceil(hungLights / 2) : hungLights
  const rows: [number, number][] = fourTowers
    ? [
        [frontZ, front],
        [-frontZ, hungLights - front],
      ]
    : [[frontZ, front]]
  for (const [z, count] of rows) {
    for (let i = 0; i < count; i++) {
      lights.push({
        id: `light-${z > 0 ? 'f' : 'b'}-${i}`,
        kind: 'light',
        position: [-width / 2 + (width * (i + 0.5)) / count, trussH - 0.4, z],
        rotation: [0, 0, 0],
        size: [0.4, 0.6, 0.4],
      })
    }
  }
  for (let i = 0; i < washes; i++) {
    lights.push({
      id: `wash-${i}`,
      kind: 'light',
      position: [-width / 2 + (width * (i + 0.5)) / washes, DECK_H + 0.15, depth / 2 - 0.3],
      rotation: [0, 0, 0],
      size: [0.3, 0.3, 0.3],
    })
  }

  const screens: Draft[] = screen
    ? [
        {
          id: 'screen',
          kind: 'screen',
          position: [0, DECK_H + trussH * 0.35, -depth / 2 + 0.3],
          rotation: [0, 0, 0],
          size: [width * 0.7, trussH * 0.5, 0.2],
        },
      ]
    : []

  const ordered = [...deck, ...truss, ...speakers, ...lights, ...screens]
  const last = ordered.length - 1
  const parts: Part[] = ordered.map((d, i) => {
    const order = i / last
    const flat = Math.hypot(d.position[0], d.position[2])
    const dir: [number, number] = flat > 1e-6 ? [d.position[0] / flat, d.position[2] / flat] : [0, 1]
    const reach = 3 + 6 * order
    return { ...d, order, exploded: [dir[0] * reach, 8 + 6 * order, dir[1] * reach] }
  })

  return { seed, parts, bounds: [span + 3.6, trussH + 1, depth + (thrust ? 3 : 0)] }
}
