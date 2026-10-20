# Stage 2 — Stage + Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The home page becomes the real thing: a procedurally generated concert stage that assembles in WebGL as you scroll the pinned hero (with an SVG fallback), lit and coloured live by the console, plus finished Manifesto, Work, Services and Contact sections.

**Architecture:** `generateStage(seed)` turns a seed into plain part data. Two renderers read that data: `StageSvg` (front elevation, server-safe fallback and Work previews) and `StageScene` (React Three Fiber, instanced meshes, additive light cones, bloom). A small view store (`stage/view.ts`) carries `seed / progress / visible / webglReady`; the hero's ScrollTrigger writes `progress`, the WebGL scene reads it and the console store every frame without React re-renders. One persistent `<Canvas>` sits fixed behind `<main>`; the hero section is transparent, every other section is opaque.

**Tech Stack:** Next.js 16.4 (App Router), React 19.3, three 0.186, @react-three/fiber 9.8, @react-three/postprocessing 3.2 + postprocessing 6.39, GSAP 3.15 (ScrollTrigger, SplitText), Lenis 1.3, Vitest 5.

**Spec:** `docs/superpowers/specs/portfolio-design.md` (§4.2 Home, §5 Console, §6 Stage, §7 Audio, §8 Visual, §11 A11y, §12 Perf, §14 Stage 2)

**Inputs carried from Stage 1:** final-review note "decide how `activeCue` behaves during a programmatic glide" (Task 6); "register ScrollTrigger where it's used" (Task 5); issue #14 no sound in Safari (Task 9, blocked on a Safari probe).

## Global Constraints

- Repo `Se-hoon-K/stage-console`; every task on its own branch, Conventional Commits, PR, CI `check` green, squash-merge.
- **No `Co-Authored-By` trailer in commits. No "Generated with Claude Code" line in PR bodies.**
- Commit identity is repo-local `Sehoon Ko <133936213+Se-hoon-K@users.noreply.github.com>`; never change git config.
- Colours: stage `#0E0E0E`, panel `#1A1A1A`, line `#2E2E2E`, ink/paper `#EDEBE6`, mute `#8A8780`, LED `#FF3B1F` (= "lit" only).
- No border radius except physically round controls; no decorative shadows (LED glow allowed on lit elements).
- `prefers-reduced-motion: reduce` → hero not pinned, stage shown assembled (`progress = 1`), no SplitText/scrub animations, no marquee, no camera parallax.
- Canvas is `aria-hidden`; the hero has a screen-reader description of the stage.
- Stage units are metres, y up, audience on +z. Same seed → identical stage everywhere.
- Assembly: parts animate during progress 0–0.8; lights switch on one by one during 0.8–1.0.
- dpr capped at 2; render loop stops when the hero is off screen; no bloom below 768px width.
- Console value ranges unchanged (master 0–1, hue 0–360, intensity 0–1, tempo 60–180, fog 0–1).
- Agency name stays `agency.name = '[AGENCY]'`; all copy is placeholder.

## Review Focus

1. **No WebGL** (old GPU, blocked context, privacy browser) → hero still shows the stage as an SVG elevation and the console still works; nothing throws. Pinned in Task 2 (SVG visible while `webglReady` is false) and Task 4 (`canUseWebGL` false → no canvas).
2. **Reduced motion** → hero is not pinned, stage appears fully assembled, HUD reads `ASSEMBLY 100%`. Pinned in Task 5.
3. **Pressing a cue while a glide is running** → the cue LED goes straight to the pressed cue without flickering through sections passed on the way. Pinned in Task 6.
4. **Same seed, different places** (hero, Work preview, future event page) → identical stage; no part ever sits below the floor. Pinned in Task 1.
5. **Scroll progress outside 0–1 or NaN** (ScrollTrigger overshoot, bad math) → stored progress stays within 0–1. Pinned in Task 2.

## File Structure

```
content/shows.ts                     Show type + 5 placeholder shows (seed each)          T1
content/agency.ts                    + heroSeed                                            T1
stage/prng.ts (+test)                mulberry32                                            T1
stage/generateStage.ts (+test)       seed → Stage {parts, bounds}                          T1
lib/store.ts                         createStore<T>() (get/set/subscribe/reset/use)        T2
stage/view.ts (+test)                stageView store: seed, progress, visible, webglReady  T2
stage/elevation.ts (+test)           Stage → 2D shapes for SVG                             T2
stage/StageSvg.tsx                   SVG renderer                                          T2
stage/assembly.ts (+test)            partOffset, snapEase, lightsOn, assembledCount        T3
stage/lighting.ts (+test)            lightLevel (chase)                                    T3
webgl/support.ts (+test)             canUseWebGL()                                         T4
console/padEvents.ts (+test)         emitPadHit / onPadHit                                 T4
webgl/beamMaterial.ts                additive cone shader                                  T4
webgl/StageScene.tsx                 instanced parts, rig, fog, camera, bloom              T4
webgl/StageCanvas.tsx                <Canvas> (client only)                                T4
webgl/Scene.tsx                      fixed layer + dynamic import                          T4
lib/gsap.ts, lib/__mocks__/gsap.ts   registered gsap/ScrollTrigger/SplitText + test mock   T5
components/sections/HeroStage.tsx (+test)  pin, progress, HUD, SVG layer, title split     T5
lib/scroll.ts (+test), console/useCueTracking.ts   glide suppression                      T6
components/ConsoleCssVars.tsx (+test)       --master / --hue on <html>                     T7
components/sections/Manifesto.tsx           outline→fill scrub, width follows master       T7
components/sections/WorkList.tsx (+test)    rows + hover preview                           T8
components/sections/ServiceRack.tsx (+test) rack units with Details toggles               T8
components/sections/ContactBlock.tsx (+test) marquee, Book button, Melbourne time         T8
(Task 9 files decided after the Safari probe)                                   T9
```

## Deferred (not in Stage 2)

- Event detail page, page transitions, preloader, 404, mobile console sheet: Stage 3.
- Work rows become links in Stage 3 (no `/events/*` routes exist yet, so rows are not links now).
- Sub-woofers under the deck (spec "optional subs"), shadows, mobile part-count reduction, WebGL context-loss recovery: Stage 3 perf pass.
- Console store migration onto `lib/store.ts`: not needed; leave Stage 1 code as is.

---

## Task 0: Commit this plan and open issues (controller)

- [ ] **Step 1:** branch `docs/stage2-plan`, commit this file (`docs: add stage 2 implementation plan`), PR, merge.
- [ ] **Step 2:** create one issue per Task 1–8 in milestone `Stage 2: Stage + home` (title = task title, body = "Plan Task N"). Task 9 is tracked by the existing issue #14.

---

## Task 1: Shows content, PRNG and stage generator

**Files:**
- Create: `content/shows.ts`, `stage/prng.ts`, `stage/generateStage.ts`
- Modify: `content/agency.ts` (add `heroSeed`)
- Test: `stage/prng.test.ts`, `stage/generateStage.test.ts`

**Interfaces:**
- Produces:
  - `type Show = { slug: string; name: string; city: string; venue: string; date: string; type: 'Festival' | 'Concert' | 'Launch' | 'Conference'; capacity: number; seed: number; runSheet: { time: string; cue: string }[]; stats: { label: string; value: number; unit?: string }[]; images: { src: string; alt: string }[]; featured: boolean }`; `shows: Show[]` (5 items)
  - `agency.heroSeed: number` (= 7)
  - `mulberry32(seed: number): () => number` in [0, 1)
  - `type PartKind = 'deck' | 'truss' | 'light' | 'speaker' | 'screen'`, `type Vec3 = [number, number, number]`, `type Part = { id: string; kind: PartKind; position: Vec3; rotation: Vec3; size: Vec3; exploded: Vec3; order: number }`, `type Stage = { seed: number; parts: Part[]; bounds: Vec3 }`
  - `generateStage(seed: number): Stage` — `position` is the box centre when assembled; `size` the full box extents; `exploded` the offset added at the start of assembly; `order` in [0, 1], increasing deck → truss → speakers → lights → screen.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/stage-generator
```

- [ ] **Step 2: Write the failing tests**

`stage/prng.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { mulberry32 } from './prng'

describe('mulberry32', () => {
  it('is deterministic per seed', () => {
    const a = mulberry32(42)
    const b = mulberry32(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('differs between seeds and stays in [0, 1)', () => {
    const a = mulberry32(1)
    const b = mulberry32(2)
    expect(a()).not.toBe(b())
    const r = mulberry32(99)
    for (let i = 0; i < 1000; i++) {
      const v = r()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
})
```

`stage/generateStage.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { shows } from '@/content/shows'
import { generateStage } from './generateStage'

const SEEDS = [1, 7, 42, 1234, 99999, ...shows.map((s) => s.seed)]

describe('generateStage', () => {
  it('returns the identical stage for the same seed', () => {
    expect(generateStage(7)).toEqual(generateStage(7))
  })

  it('returns different stages for different seeds', () => {
    expect(generateStage(1)).not.toEqual(generateStage(2))
  })

  it.each(SEEDS)('seed %i: no part sits below the floor', (seed) => {
    for (const p of generateStage(seed).parts) {
      expect(p.position[1] - p.size[1] / 2).toBeGreaterThanOrEqual(-1e-9)
    }
  })

  it.each(SEEDS)('seed %i: deck width 8–14 m and 8–24 hung lights', (seed) => {
    const { parts } = generateStage(seed)
    const deck = parts.find((p) => p.kind === 'deck')!
    expect(deck.size[0]).toBeGreaterThanOrEqual(8)
    expect(deck.size[0]).toBeLessThanOrEqual(14)
    const hung = parts.filter((p) => p.kind === 'light' && p.position[1] > 3)
    expect(hung.length).toBeGreaterThanOrEqual(8)
    expect(hung.length).toBeLessThanOrEqual(24)
  })

  it.each(SEEDS)('seed %i: assembly order follows deck → truss → speakers → lights → screen', (seed) => {
    const { parts } = generateStage(seed)
    const rank = { deck: 0, truss: 1, speaker: 2, light: 3, screen: 4 } as const
    for (let i = 1; i < parts.length; i++) {
      expect(parts[i].order).toBeGreaterThanOrEqual(parts[i - 1].order)
      expect(rank[parts[i].kind]).toBeGreaterThanOrEqual(rank[parts[i - 1].kind])
    }
    expect(parts[0].order).toBe(0)
    expect(parts[parts.length - 1].order).toBe(1)
  })

  it('gives every part a unique id and a non-zero exploded offset', () => {
    const { parts } = generateStage(7)
    expect(new Set(parts.map((p) => p.id)).size).toBe(parts.length)
    for (const p of parts) expect(Math.hypot(...p.exploded)).toBeGreaterThan(1)
  })
})
```

- [ ] **Step 3: Run to verify they fail**

Run: `pnpm test stage/`
Expected: FAIL, cannot resolve `./prng`, `./generateStage`, `@/content/shows`.

- [ ] **Step 4: Create `stage/prng.ts`**

```ts
/** Small, fast, seedable PRNG (mulberry32). Returns floats in [0, 1). */
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
```

- [ ] **Step 5: Create `stage/generateStage.ts`**

```ts
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
  const zero: Vec3 = [0, 0, 0]

  const deck: Draft[] = [
    { id: 'deck-main', kind: 'deck', position: [0, DECK_H / 2, 0], rotation: zero, size: [width, DECK_H, depth] },
  ]
  if (thrust) {
    deck.push({ id: 'deck-thrust', kind: 'deck', position: [0, DECK_H / 2, depth / 2 + 1.5], rotation: zero, size: [2, DECK_H, 3] })
  }

  const truss: Draft[] = []
  const towerZs = fourTowers ? [frontZ, -frontZ] : [frontZ]
  for (const z of towerZs) {
    for (const side of [-1, 1]) {
      truss.push({
        id: `tower-${side < 0 ? 'l' : 'r'}-${z > 0 ? 'f' : 'b'}`,
        kind: 'truss',
        position: [side * (width / 2 + BEAM / 2), trussH / 2, z],
        rotation: zero,
        size: [BEAM, trussH, BEAM],
      })
    }
  }
  const segments = Math.ceil(span / SEGMENT)
  const segLen = span / segments
  for (const z of [frontZ, -frontZ]) {
    for (let i = 0; i < segments; i++) {
      truss.push({
        id: `beam-${z > 0 ? 'f' : 'b'}-${i}`,
        kind: 'truss',
        position: [-span / 2 + segLen * (i + 0.5), trussH + BEAM / 2, z],
        rotation: zero,
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
        rotation: zero,
        size: [1, 0.5, 0.8],
      })
    }
  }

  const lights: Draft[] = []
  const front = Math.ceil(hungLights / 2)
  const rows: [number, number][] = [
    [frontZ, front],
    [-frontZ, hungLights - front],
  ]
  for (const [z, count] of rows) {
    for (let i = 0; i < count; i++) {
      lights.push({
        id: `light-${z > 0 ? 'f' : 'b'}-${i}`,
        kind: 'light',
        position: [-width / 2 + (width * (i + 0.5)) / count, trussH - 0.4, z],
        rotation: zero,
        size: [0.4, 0.6, 0.4],
      })
    }
  }
  for (let i = 0; i < washes; i++) {
    lights.push({
      id: `wash-${i}`,
      kind: 'light',
      position: [-width / 2 + (width * (i + 0.5)) / washes, DECK_H + 0.15, depth / 2 - 0.3],
      rotation: zero,
      size: [0.3, 0.3, 0.3],
    })
  }

  const screens: Draft[] = screen
    ? [
        {
          id: 'screen',
          kind: 'screen',
          position: [0, DECK_H + trussH * 0.35, -depth / 2 + 0.3],
          rotation: zero,
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
```

- [ ] **Step 6: Create `content/shows.ts`**

```ts
export type Show = {
  slug: string
  name: string
  city: string
  venue: string
  date: string
  type: 'Festival' | 'Concert' | 'Launch' | 'Conference'
  capacity: number
  seed: number
  runSheet: { time: string; cue: string }[]
  stats: { label: string; value: number; unit?: string }[]
  images: { src: string; alt: string }[]
  featured: boolean
}

export const shows: Show[] = [
  {
    slug: 'night-signal',
    name: 'Night Signal',
    city: 'Melbourne',
    venue: 'Docklands Yard',
    date: '2026-03-14',
    type: 'Festival',
    capacity: 18000,
    seed: 314,
    runSheet: [
      { time: '16:00', cue: 'Doors' },
      { time: '18:30', cue: 'Act 1' },
      { time: '20:15', cue: 'Act 2' },
      { time: '22:00', cue: 'Headliner' },
      { time: '23:30', cue: 'Curfew' },
    ],
    stats: [
      { label: 'Attendees', value: 18000 },
      { label: 'Crew', value: 212 },
      { label: 'Lights', value: 640 },
      { label: 'Cable', value: 38, unit: 'km' },
    ],
    images: [],
    featured: true,
  },
  {
    slug: 'harbour-lights',
    name: 'Harbour Lights',
    city: 'Sydney',
    venue: 'Barangaroo Reserve',
    date: '2025-12-31',
    type: 'Concert',
    capacity: 24000,
    seed: 1231,
    runSheet: [],
    stats: [],
    images: [],
    featured: false,
  },
  {
    slug: 'low-frequency',
    name: 'Low Frequency',
    city: 'Brisbane',
    venue: 'Riverstage',
    date: '2025-09-20',
    type: 'Festival',
    capacity: 9500,
    seed: 920,
    runSheet: [],
    stats: [],
    images: [],
    featured: false,
  },
  {
    slug: 'ironworks-live',
    name: 'Ironworks Live',
    city: 'Perth',
    venue: 'Fremantle Shed 4',
    date: '2025-06-07',
    type: 'Launch',
    capacity: 1200,
    seed: 607,
    runSheet: [],
    stats: [],
    images: [],
    featured: false,
  },
  {
    slug: 'daybreak-summit',
    name: 'Daybreak Summit',
    city: 'Adelaide',
    venue: 'Convention Hall B',
    date: '2025-04-02',
    type: 'Conference',
    capacity: 3000,
    seed: 402,
    runSheet: [],
    stats: [],
    images: [],
    featured: false,
  },
]
```

- [ ] **Step 7: Add `heroSeed` to `content/agency.ts`**

Add `heroSeed: number` to the `agency` type annotation and `heroSeed: 7,` to the object (after `city`).

- [ ] **Step 8: Run tests, then all checks**

Run: `pnpm test stage/` → PASS. Then `pnpm test && pnpm lint && pnpm typecheck`.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(stage): add seeded stage generator and placeholder shows"
```

---

## Task 2: View store and SVG fallback

**Files:**
- Create: `lib/store.ts`, `stage/view.ts`, `stage/elevation.ts`, `stage/StageSvg.tsx`
- Test: `stage/view.test.ts`, `stage/elevation.test.ts`, `stage/StageSvg.test.tsx`

**Interfaces:**
- Consumes: `generateStage`, `Stage`, `Part` (Task 1), `agency.heroSeed` (Task 1).
- Produces:
  - `createStore<T extends object>(initial: T)` → `{ get(): T; set(partial: Partial<T>): void; subscribe(fn: () => void): () => void; reset(): void; use<S>(selector: (s: T) => S): S }` — `set` ignores `undefined` values and notifies only on change.
  - `type StageViewState = { seed: number; progress: number; visible: boolean; webglReady: boolean }`; `stageView` (same API as above; `set` clamps `progress` to 0–1 and ignores NaN); `useStageView = stageView.use`. Initial: `{ seed: agency.heroSeed, progress: 0, visible: true, webglReady: false }`.
  - `type Elevation = { viewBox: string; rects: { id: string; kind: PartKind; x: number; y: number; w: number; h: number }[]; lights: { id: string; cx: number; cy: number; r: number }[] }`; `toElevation(stage: Stage): Elevation` (front view: x → x, y → −y, ground line at y = 0).
  - `<StageSvg stage={Stage} hue={number} className?={string} />` — `aria-hidden`, assembled stage, light circles filled `hsl(hue 100% 60%)`.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/stage-svg
```

- [ ] **Step 2: Write the failing tests**

`stage/view.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { stageView } from './view'

describe('stageView', () => {
  beforeEach(() => stageView.reset())

  it('starts on the hero seed, not ready, visible, progress 0', () => {
    expect(stageView.get()).toEqual({ seed: 7, progress: 0, visible: true, webglReady: false })
  })

  it('clamps progress to 0–1 and ignores NaN', () => {
    stageView.set({ progress: 1.4 })
    expect(stageView.get().progress).toBe(1)
    stageView.set({ progress: -0.2 })
    expect(stageView.get().progress).toBe(0)
    stageView.set({ progress: 0.5 })
    stageView.set({ progress: Number.NaN })
    expect(stageView.get().progress).toBe(0.5)
  })

  it('notifies only when something changed', () => {
    const fn = vi.fn()
    const off = stageView.subscribe(fn)
    stageView.set({ visible: true })
    expect(fn).not.toHaveBeenCalled()
    stageView.set({ visible: false, seed: 9 })
    expect(fn).toHaveBeenCalledTimes(1)
    off()
  })
})
```

`stage/elevation.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { generateStage } from './generateStage'
import { toElevation } from './elevation'

describe('toElevation', () => {
  const stage = generateStage(7)
  const el = toElevation(stage)

  it('draws one rect per non-light part and one circle per light', () => {
    const lights = stage.parts.filter((p) => p.kind === 'light').length
    expect(el.lights).toHaveLength(lights)
    expect(el.rects).toHaveLength(stage.parts.length - lights)
  })

  it('keeps every shape inside the viewBox', () => {
    const [x0, y0, w, h] = el.viewBox.split(' ').map(Number)
    for (const r of el.rects) {
      expect(r.x).toBeGreaterThanOrEqual(x0 - 1e-9)
      expect(r.y).toBeGreaterThanOrEqual(y0 - 1e-9)
      expect(r.x + r.w).toBeLessThanOrEqual(x0 + w + 1e-9)
      expect(r.y + r.h).toBeLessThanOrEqual(y0 + h + 1e-9)
    }
  })

  it('puts the deck on the ground line (y = 0 is the floor)', () => {
    const deck = el.rects.find((r) => r.id === 'deck-main')!
    expect(deck.y + deck.h).toBeCloseTo(0)
  })
})
```

`stage/StageSvg.test.tsx`:
```tsx
import { render } from '@testing-library/react'
import { expect, it } from 'vitest'
import { generateStage } from './generateStage'
import { StageSvg } from './StageSvg'

it('renders a hidden SVG with lights in the console hue', () => {
  const stage = generateStage(7)
  const { container } = render(<StageSvg stage={stage} hue={200} />)
  const svg = container.querySelector('svg')!
  expect(svg).toHaveAttribute('aria-hidden', 'true')
  const circles = svg.querySelectorAll('circle')
  expect(circles.length).toBe(stage.parts.filter((p) => p.kind === 'light').length)
  expect(circles[0].getAttribute('fill')).toBe('hsl(200 100% 60%)')
})
```

- [ ] **Step 3: Run to verify they fail**

Run: `pnpm test stage/`
Expected: FAIL on unresolved `./view`, `./elevation`, `./StageSvg`.

- [ ] **Step 4: Create `lib/store.ts`**

```ts
import { useSyncExternalStore } from 'react'

/** Tiny external store: readable every frame via get(), subscribable from React via use(). */
export function createStore<T extends object>(initial: T) {
  let state: T = { ...initial }
  const listeners = new Set<() => void>()

  const store = {
    get: () => state,

    set(partial: Partial<T>) {
      let next: T | null = null
      for (const key of Object.keys(partial) as (keyof T)[]) {
        const value = partial[key]
        if (value === undefined || value === state[key]) continue
        next ??= { ...state }
        next[key] = value as T[keyof T]
      }
      if (!next) return
      state = next
      listeners.forEach((fn) => fn())
    },

    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },

    reset() {
      state = { ...initial }
      listeners.forEach((fn) => fn())
    },

    /** Selector must return a primitive or otherwise stable value, or React re-renders forever. */
    use<S>(selector: (s: T) => S): S {
      // eslint-disable-next-line react-hooks/rules-of-hooks -- `use` is a hook by contract
      return useSyncExternalStore(store.subscribe, () => selector(state), () => selector(initial))
    },
  }
  return store
}
```

- [ ] **Step 5: Create `stage/view.ts`**

```ts
import { agency } from '@/content/agency'
import { createStore } from '@/lib/store'

export type StageViewState = { seed: number; progress: number; visible: boolean; webglReady: boolean }

const base = createStore<StageViewState>({ seed: agency.heroSeed, progress: 0, visible: true, webglReady: false })

export const stageView = {
  ...base,
  set(partial: Partial<StageViewState>) {
    const next = { ...partial }
    if (next.progress !== undefined) {
      if (Number.isNaN(next.progress)) delete next.progress
      else next.progress = Math.min(1, Math.max(0, next.progress))
    }
    base.set(next)
  },
}

export const useStageView = base.use
```

- [ ] **Step 6: Create `stage/elevation.ts`**

```ts
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
```

- [ ] **Step 7: Create `stage/StageSvg.tsx`**

```tsx
import { useMemo } from 'react'
import { toElevation } from './elevation'
import type { Stage } from './generateStage'

type Props = { stage: Stage; hue: number; className?: string }

/** Static front elevation: the no-WebGL fallback and the Work list preview. */
export function StageSvg({ stage, hue, className }: Props) {
  const el = useMemo(() => toElevation(stage), [stage])
  return (
    <svg viewBox={el.viewBox} className={className} aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <line x1="-100" x2="100" y1="0" y2="0" stroke="var(--color-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {el.rects.map((r) => (
        <rect
          key={r.id}
          x={r.x}
          y={r.y}
          width={r.w}
          height={r.h}
          fill={r.kind === 'deck' ? 'var(--color-panel)' : 'none'}
          stroke="var(--color-ink)"
          strokeOpacity={r.kind === 'screen' ? 0.4 : 0.8}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {el.lights.map((l) => (
        <circle key={l.id} cx={l.cx} cy={l.cy} r={l.r} fill={`hsl(${Math.round(hue)} 100% 60%)`} />
      ))}
    </svg>
  )
}
```

- [ ] **Step 8: Run tests and checks**

Run: `pnpm test stage/ && pnpm test && pnpm lint && pnpm typecheck`
Expected: all pass. If the `react-hooks/rules-of-hooks` disable comment is reported as unused, delete it.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(stage): add view store and SVG elevation fallback"
```

---

## Task 3: Assembly and lighting math

**Files:**
- Create: `stage/assembly.ts`, `stage/lighting.ts`
- Test: `stage/assembly.test.ts`, `stage/lighting.test.ts`

**Interfaces:**
- Consumes: `Stage` (Task 1).
- Produces:
  - `ASSEMBLY_END = 0.8`
  - `snapEase(t: number): number` — 0 → 0, 1 → 1, small overshoot (max ≤ 1.1)
  - `partOffset(progress: number, order: number): number` — 1 = fully exploded, 0 = in place; a part moves during `progress ∈ [order·0.65, order·0.65 + 0.15]`
  - `lightsOn(progress: number, index: number, count: number): number` — 0–1, light `index` switches on around `0.8 + 0.18·index/count`
  - `assembledCount(stage: Stage, progress: number): number`
  - `lightLevel(args: { progress: number; index: number; count: number; time: number; tempo: number }): number` — `lightsOn × (0.35 + 0.65 × pulse)`, pulse a chase wave travelling across lights at `tempo` BPM

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/stage-assembly-math
```

- [ ] **Step 2: Write the failing tests**

`stage/assembly.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { ASSEMBLY_END, assembledCount, lightsOn, partOffset, snapEase } from './assembly'
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
    expect(partOffset(0.5 * 0.65 + 0.15, 0.5)).toBeCloseTo(0)
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
    expect(lightsOn(0.85, 0, 10)).toBe(1)
    expect(lightsOn(0.85, 9, 10)).toBe(0)
  })
})

describe('assembledCount', () => {
  it('counts parts in place', () => {
    const stage = generateStage(7)
    expect(assembledCount(stage, 0)).toBe(0)
    expect(assembledCount(stage, 1)).toBe(stage.parts.length)
  })
})
```

`stage/lighting.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { lightLevel } from './lighting'

describe('lightLevel', () => {
  const base = { index: 0, count: 8, time: 0, tempo: 120 }

  it('is dark before the lights switch on', () => {
    expect(lightLevel({ ...base, progress: 0.5 })).toBe(0)
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
```

- [ ] **Step 3: Run to verify they fail**

Run: `pnpm test stage/assembly.test.ts stage/lighting.test.ts`
Expected: FAIL on unresolved modules.

- [ ] **Step 4: Create `stage/assembly.ts`**

```ts
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
```

- [ ] **Step 5: Create `stage/lighting.ts`**

```ts
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
```

- [ ] **Step 6: Run tests and checks**

Run: `pnpm test && pnpm lint && pnpm typecheck` → all pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(stage): add assembly easing and light chase math"
```

---

## Task 4: WebGL stage scene

**Files:**
- Create: `webgl/support.ts`, `webgl/beamMaterial.ts`, `webgl/StageScene.tsx`, `webgl/StageCanvas.tsx`, `webgl/Scene.tsx`, `console/padEvents.ts`
- Modify: `components/console/Pad.tsx` (emit pad hits), `app/layout.tsx` (mount Scene, raise main/footer), `components/Section.tsx` (opaque background except hero), `components/Footer.tsx` (raise + opaque)
- Test: `webgl/support.test.ts`, `console/padEvents.test.ts`, `components/console/audio-controls.test.tsx` (add one case)

**Interfaces:**
- Consumes: `stageView`, `useStageView` (Task 2); `generateStage`, `Part`, `PartKind` (Task 1); `partOffset`, `lightsOn` (Task 3); `lightLevel` (Task 3); `consoleStore` (Stage 1).
- Produces: `canUseWebGL(): boolean` (cached), `resetWebGLSupportCache(): void` (tests only); `emitPadHit(kind: PadKind): void`, `onPadHit(fn: (kind: PadKind) => void): () => void`; `<Scene />` (fixed, `aria-hidden`, renders nothing without WebGL). On canvas creation `stageView.set({ webglReady: true })`.

- [ ] **Step 1: Branch and install**

```bash
git switch main && git pull --ff-only && git switch -c feat/webgl-stage
pnpm add three @react-three/fiber @react-three/postprocessing postprocessing
pnpm add -D @types/three
```

- [ ] **Step 2: Write the failing tests**

`webgl/support.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { canUseWebGL, resetWebGLSupportCache } from './support'

describe('canUseWebGL', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    resetWebGLSupportCache()
  })

  it('is false when no WebGL context can be created', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    expect(canUseWebGL()).toBe(false)
  })

  it('is false when context creation throws', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(canUseWebGL()).toBe(false)
  })

  it('is true when a context exists, and caches the answer', () => {
    const spy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue({} as unknown as RenderingContext)
    expect(canUseWebGL()).toBe(true)
    expect(canUseWebGL()).toBe(true)
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
```

`console/padEvents.test.ts`:
```ts
import { expect, it, vi } from 'vitest'
import { emitPadHit, onPadHit } from './padEvents'

it('delivers pad hits to listeners until they unsubscribe', () => {
  const fn = vi.fn()
  const off = onPadHit(fn)
  emitPadHit('kick')
  expect(fn).toHaveBeenCalledWith('kick')
  off()
  emitPadHit('drop')
  expect(fn).toHaveBeenCalledTimes(1)
})
```

Add to `components/console/audio-controls.test.tsx` (new import `import { onPadHit } from '@/console/padEvents'` at the top; the `@/console/audio` mock stays):
```tsx
  it('announces every pad hit to the stage, even with sound off', () => {
    const hits: string[] = []
    const off = onPadHit((k) => hits.push(k))
    render(<Pad kind="hit" label="Hit" />)
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Hit' }), { button: 0 })
    off()
    expect(hits).toEqual(['hit'])
  })
```

- [ ] **Step 3: Run to verify they fail**

Run: `pnpm test webgl/ console/padEvents.test.ts components/console/audio-controls.test.tsx`
Expected: FAIL on unresolved `./support`, `./padEvents`; the new Pad case fails (no emission).

- [ ] **Step 4: Create `webgl/support.ts`**

```ts
let cached: boolean | null = null

/** Can this browser create a WebGL context? Cached after the first check. */
export function canUseWebGL(): boolean {
  if (cached !== null) return cached
  try {
    const canvas = document.createElement('canvas')
    cached = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    cached = false
  }
  return cached
}

export function resetWebGLSupportCache() {
  cached = null
}
```

- [ ] **Step 5: Create `console/padEvents.ts`**

```ts
import type { PadKind } from './audio'

type Listener = (kind: PadKind) => void
const listeners = new Set<Listener>()

/** Pad hits for visuals (stage flash). Independent of sound. */
export function emitPadHit(kind: PadKind) {
  listeners.forEach((fn) => fn(kind))
}

export function onPadHit(fn: Listener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
```

- [ ] **Step 6: Emit from `components/console/Pad.tsx`**

Add `import { emitPadHit } from '@/console/padEvents'` and call it inside `fire` right after `playPad(kind)`:

```tsx
  const fire = () => {
    playPad(kind)
    emitPadHit(kind)
    setLit(true)
```

- [ ] **Step 7: Run the unit tests**

Run: `pnpm test webgl/ console/padEvents.test.ts components/console/audio-controls.test.tsx` → PASS.

- [ ] **Step 8: Create `webgl/beamMaterial.ts`**

```ts
import * as THREE from 'three'

/** Additive light cone: bright at the fixture, fading to the floor, with a slow shimmer. */
export function createBeamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color() }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      attribute float aLevel;
      varying float vLevel;
      varying float vY;
      varying vec3 vWorld;
      void main() {
        vLevel = aLevel;
        vY = position.y;
        vec4 local = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          local = instanceMatrix * local;
        #endif
        vec4 world = modelMatrix * local;
        vWorld = world.xyz;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      varying float vLevel;
      varying float vY;
      varying vec3 vWorld;
      void main() {
        float fade = smoothstep(-1.0, 0.0, vY);
        float shimmer = 0.85 + 0.15 * sin(vWorld.y * 3.0 + vWorld.x + uTime * 1.5);
        gl_FragColor = vec4(uColor * vLevel * fade * shimmer * 0.35, 1.0);
      }
    `,
  })
}
```

- [ ] **Step 9: Create `webgl/StageScene.tsx`**

```tsx
'use client'

import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import type { BloomEffect } from 'postprocessing'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { onPadHit } from '@/console/padEvents'
import { consoleStore } from '@/console/store'
import { lightsOn, partOffset } from '@/stage/assembly'
import { generateStage, type Part } from '@/stage/generateStage'
import { lightLevel } from '@/stage/lighting'
import { stageView, useStageView } from '@/stage/view'
import { createBeamMaterial } from './beamMaterial'

type BodyKind = 'deck' | 'truss' | 'speaker' | 'screen'
const BODY_KINDS: BodyKind[] = ['deck', 'truss', 'speaker', 'screen']
const BODY_COLORS: Record<BodyKind, string> = { deck: '#262626', truss: '#1c1c1c', speaker: '#111111', screen: '#0a0a0a' }
const BEAM_MIN_HEIGHT = 3

// Scratch objects reused every frame (no per-frame allocation).
const obj = new THREE.Object3D()
const col = new THREE.Color()
const hueCol = new THREE.Color()
const camTarget = new THREE.Vector3()
// Pad flash, 1 on hit, decays to 0. One scene at a time, so module scope is fine.
const flash = { value: 0 }

function placePart(p: Part, progress: number) {
  const f = partOffset(progress, p.order)
  obj.position.set(p.position[0] + p.exploded[0] * f, p.position[1] + p.exploded[1] * f, p.position[2] + p.exploded[2] * f)
  obj.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2])
}

function Bodies({ kind, parts }: { kind: BodyKind; parts: Part[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const { progress } = stageView.get()
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]
      placePart(p, progress)
      obj.scale.set(p.size[0], p.size[1], p.size[2])
      obj.updateMatrix()
      mesh.setMatrixAt(i, obj.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, parts.length]} frustumCulled={false}>
      <boxGeometry />
      <meshStandardMaterial color={BODY_COLORS[kind]} roughness={0.6} metalness={0.4} />
    </instancedMesh>
  )
}

function Rig({ lights }: { lights: Part[] }) {
  const lensRef = useRef<THREE.InstancedMesh>(null)
  const beamRef = useRef<THREE.InstancedMesh>(null)
  const washRef = useRef<THREE.PointLight>(null)

  const beamGeometry = useMemo(() => {
    const g = new THREE.ConeGeometry(0.3, 1, 32, 1, true)
    g.translate(0, -0.5, 0) // apex at the fixture, base 1 unit below
    g.setAttribute('aLevel', new THREE.InstancedBufferAttribute(new Float32Array(lights.length), 1))
    return g
  }, [lights.length])
  const beamMaterial = useMemo(() => createBeamMaterial(), [])
  useEffect(
    () => () => {
      beamGeometry.dispose()
      beamMaterial.dispose()
    },
    [beamGeometry, beamMaterial],
  )

  // instanceColor must exist before the first render so the lens material compiles with it.
  useLayoutEffect(() => {
    const lens = lensRef.current
    if (!lens) return
    for (let i = 0; i < lights.length; i++) lens.setColorAt(i, col.setRGB(0, 0, 0))
    if (lens.instanceColor) lens.instanceColor.needsUpdate = true
  }, [lights.length])

  useFrame((state) => {
    const lens = lensRef.current
    const beams = beamRef.current
    if (!lens || !beams) return
    const { progress } = stageView.get()
    const c = consoleStore.get()
    const time = state.clock.elapsedTime
    hueCol.setHSL(c.hue / 360, 1, 0.55)
    beamMaterial.uniforms.uColor.value.copy(hueCol)
    beamMaterial.uniforms.uTime.value = time
    const levels = beamGeometry.getAttribute('aLevel') as THREE.InstancedBufferAttribute

    let sum = 0
    for (let i = 0; i < lights.length; i++) {
      const p = lights[i]
      const on = lightsOn(progress, i, lights.length)
      const level =
        lightLevel({ progress, index: i, count: lights.length, time, tempo: c.tempo }) * c.master * c.intensity +
        flash.value * on
      levels.setX(i, level)
      sum += level

      placePart(p, progress)
      obj.scale.setScalar(1)
      obj.updateMatrix()
      lens.setMatrixAt(i, obj.matrix)
      lens.setColorAt(i, col.copy(hueCol).multiplyScalar(0.15 + level * 2.5))

      const hung = p.position[1] > BEAM_MIN_HEIGHT
      const h = hung ? obj.position.y : 0
      obj.rotation.set(0, 0, hung ? Math.sin(time * 0.6 + i) * 0.25 : 0)
      obj.scale.set(h, h, h)
      obj.updateMatrix()
      beams.setMatrixAt(i, obj.matrix)
    }

    levels.needsUpdate = true
    lens.instanceMatrix.needsUpdate = true
    if (lens.instanceColor) lens.instanceColor.needsUpdate = true
    beams.instanceMatrix.needsUpdate = true
    if (washRef.current) {
      washRef.current.color.copy(hueCol)
      washRef.current.intensity = (sum / Math.max(1, lights.length)) * 40
    }
  })

  return (
    <>
      <instancedMesh ref={lensRef} args={[undefined, undefined, lights.length]} frustumCulled={false}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={beamRef} args={[beamGeometry, beamMaterial, lights.length]} frustumCulled={false} />
      <pointLight ref={washRef} position={[0, 6, 2]} distance={30} decay={1.5} intensity={0} />
    </>
  )
}

export function StageScene() {
  const seed = useStageView((s) => s.seed)
  const stage = useMemo(() => generateStage(seed), [seed])
  const groups = useMemo(() => {
    const by = (k: Part['kind']) => stage.parts.filter((p) => p.kind === k)
    return { deck: by('deck'), truss: by('truss'), speaker: by('speaker'), screen: by('screen'), light: by('light') }
  }, [stage])
  const fogRef = useRef<THREE.FogExp2>(null)
  const bloomRef = useRef<BloomEffect>(null)
  const [lite] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(
    () =>
      onPadHit(() => {
        flash.value = 1
      }),
    [],
  )

  useFrame((state, dt) => {
    flash.value = Math.max(0, flash.value - dt * 4)
    const c = consoleStore.get()
    const { progress } = stageView.get()
    if (fogRef.current) fogRef.current.density = 0.006 + c.fog * 0.035

    const p = Math.min(progress / 0.8, 1)
    const live = progress >= 1 && !reduced
    camTarget.set(live ? state.pointer.x * 0.8 : 0, 7 - 2.5 * p + (live ? state.pointer.y * 0.4 : 0), 30 - 11 * p)
    state.camera.position.lerp(camTarget, reduced ? 1 : 0.08)
    state.camera.lookAt(0, 3, 0)

    if (bloomRef.current) bloomRef.current.intensity = 0.6 + flash.value * 1.4
  })

  return (
    <>
      <color attach="background" args={['#0e0e0e']} />
      <fogExp2 ref={fogRef} attach="fog" args={['#0e0e0e', 0.02]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 12, 10]} intensity={0.8} />
      <group key={seed}>
        {BODY_KINDS.map((k) => groups[k].length > 0 && <Bodies key={k} kind={k} parts={groups[k]} />)}
        <Rig lights={groups.light} />
      </group>
      {!lite && (
        <EffectComposer multisampling={0}>
          <Bloom ref={bloomRef} mipmapBlur luminanceThreshold={0.4} intensity={0.6} />
        </EffectComposer>
      )}
    </>
  )
}
```

- [ ] **Step 10: Create `webgl/StageCanvas.tsx`**

```tsx
'use client'

import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { stageView, useStageView } from '@/stage/view'
import { StageScene } from './StageScene'
import { canUseWebGL } from './support'

export function StageCanvas() {
  const visible = useStageView((s) => s.visible)
  const [supported] = useState(() => canUseWebGL())
  if (!supported) return null

  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={visible ? 'always' : 'never'}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 35, position: [0, 7, 30], near: 0.1, far: 200 }}
      onCreated={() => stageView.set({ webglReady: true })}
    >
      <StageScene />
    </Canvas>
  )
}
```

- [ ] **Step 11: Create `webgl/Scene.tsx`**

```tsx
'use client'

import dynamic from 'next/dynamic'

const StageCanvas = dynamic(() => import('./StageCanvas').then((m) => m.StageCanvas), { ssr: false })

/** Persistent WebGL layer behind <main>. Decorative: the hero carries a text description. */
export function Scene() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <StageCanvas />
    </div>
  )
}
```

- [ ] **Step 12: Layering**

`app/layout.tsx`: add `import { Scene } from '@/webgl/Scene'`, render `<Scene />` right before `<main>`, and give main a stacking level:
```tsx
        <Console />
        <Scene />
        <main id="main" className="relative z-10">{children}</main>
```

`components/Section.tsx`: non-hero sections become opaque so they cover the canvas — change the class expression to
```tsx
      className={`${cue === 1 ? '' : 'border-t border-line bg-stage'} px-5 py-24 md:px-10 ${className}`}
```

`components/Footer.tsx`: add `relative z-10 bg-stage` to the footer's className.

- [ ] **Step 13: Checks**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm build`
Expected: all pass. If react-hooks/React-Compiler lint rules flag mutation inside `useFrame` (e.g. writing to geometry/material from `useMemo`), make the smallest compliant change (e.g. hold them in `useRef` / `useState` initialisers) and record it in the report. Do not disable rules file-wide.

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat(webgl): render the generated stage with instanced parts, light cones and bloom"
```

(At this point the stage is visible behind the hero at `progress = 0`, fully exploded, until Task 5 drives progress. That is expected.)

---

## Task 5: Hero — pinned assembly, HUD, title, SVG layer

**Files:**
- Create: `lib/gsap.ts`, `lib/__mocks__/gsap.ts`, `components/sections/HeroStage.tsx`
- Modify: `components/SmoothScroll.tsx` (use `lib/gsap`), `app/page.tsx` (hero), `app/page.test.tsx` (mock gsap)
- Test: `components/sections/HeroStage.test.tsx`

**Interfaces:**
- Consumes: `stageView`, `useStageView` (Task 2); `StageSvg` (Task 2); `generateStage` (Task 1); `assembledCount` (Task 3); `useConsole` (Stage 1); `agency.heroSeed`.
- Produces: `lib/gsap.ts` exporting `gsap`, `ScrollTrigger`, `SplitText` (registered once); a Vitest manual mock used via `vi.mock('@/lib/gsap')`; `<HeroStage />` placed inside the cue-1 section.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/hero-assembly
```

- [ ] **Step 2: Create `lib/gsap.ts`**

```ts
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'

gsap.registerPlugin(ScrollTrigger, SplitText)

export { gsap, ScrollTrigger, SplitText }
```

- [ ] **Step 3: Create `lib/__mocks__/gsap.ts`**

```ts
import { vi } from 'vitest'

const context = { revert: vi.fn(), add: vi.fn() }

export const gsap = {
  context: vi.fn((fn: () => void) => {
    fn()
    return context
  }),
  from: vi.fn(),
  to: vi.fn(),
  fromTo: vi.fn(),
  set: vi.fn(),
  ticker: { add: vi.fn(), remove: vi.fn(), lagSmoothing: vi.fn() },
}

export const ScrollTrigger = {
  create: vi.fn(() => ({ kill: vi.fn() })),
  update: vi.fn(),
  refresh: vi.fn(),
}

export const SplitText = {
  create: vi.fn(() => ({ chars: [], words: [], lines: [], revert: vi.fn() })),
}
```

- [ ] **Step 4: Point `components/SmoothScroll.tsx` at `lib/gsap`**

Replace the two gsap imports with `import { gsap, ScrollTrigger } from '@/lib/gsap'` and delete the line `gsap.registerPlugin(ScrollTrigger)`.

- [ ] **Step 5: Write the failing test `components/sections/HeroStage.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollTrigger } from '@/lib/gsap'
import { stageView } from '@/stage/view'
import { HeroStage } from './HeroStage'

vi.mock('@/lib/gsap')

function renderInSection() {
  return render(
    <section id="cue-1">
      <h1>We build the show.</h1>
      <HeroStage />
    </section>,
  )
}

describe('HeroStage', () => {
  beforeEach(() => {
    stageView.reset()
    vi.mocked(ScrollTrigger.create).mockClear()
    vi.mocked(window.matchMedia).mockClear()
  })

  it('pins the hero and drives stage progress from scroll', () => {
    renderInSection()
    expect(ScrollTrigger.create).toHaveBeenCalledTimes(1)
    const config = vi.mocked(ScrollTrigger.create).mock.calls[0][0] as unknown as {
      pin: boolean
      end: string
      onUpdate: (self: { progress: number }) => void
    }
    expect(config.pin).toBe(true)
    expect(config.end).toBe('+=150%')
    config.onUpdate({ progress: 0.64 })
    expect(stageView.get().progress).toBe(0.64)
  })

  it('shows the assembled stage without pinning under reduced motion', () => {
    vi.mocked(window.matchMedia).mockImplementation(
      (q: string) => ({ matches: q.includes('reduce'), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn() }) as unknown as MediaQueryList,
    )
    renderInSection()
    expect(ScrollTrigger.create).not.toHaveBeenCalled()
    expect(stageView.get().progress).toBe(1)
    expect(screen.getByText(/ASSEMBLY 100%/)).toBeInTheDocument()
  })

  it('keeps the SVG stage visible until WebGL is ready, and describes it for screen readers', () => {
    const { container } = renderInSection()
    const svg = container.querySelector('svg')!
    expect(svg.getAttribute('class')).toContain('opacity-100')
    expect(screen.getByText(/stage .* assembles as you scroll/i)).toHaveClass('sr-only')
  })
})
```

Note: the reduced-motion test replaces the global `matchMedia` stub's implementation; add `afterEach(() => vi.mocked(window.matchMedia).mockImplementation((q: string) => ({ matches: false, media: q, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() }) as unknown as MediaQueryList))` (import `afterEach`) so later tests see the default again.

- [ ] **Step 6: Run to verify it fails**

Run: `pnpm test components/sections/HeroStage.test.tsx`
Expected: FAIL, cannot resolve `./HeroStage`.

- [ ] **Step 7: Create `components/sections/HeroStage.tsx`**

```tsx
'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useConsole } from '@/console/store'
import { agency } from '@/content/agency'
import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap'
import { assembledCount } from '@/stage/assembly'
import { generateStage } from '@/stage/generateStage'
import { StageSvg } from '@/stage/StageSvg'
import { stageView, useStageView } from '@/stage/view'

export function HeroStage() {
  const ref = useRef<HTMLDivElement>(null)
  const stage = useMemo(() => generateStage(agency.heroSeed), [])
  const hue = useConsole((s) => s.hue)
  const webglReady = useStageView((s) => s.webglReady)
  const progress = useStageView((s) => s.progress)

  useEffect(() => {
    const section = ref.current?.closest('section')
    if (!section) return
    stageView.set({ seed: agency.heroSeed })

    let io: IntersectionObserver | undefined
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(([entry]) => stageView.set({ visible: entry.isIntersecting }))
      io.observe(section)
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stageView.set({ progress: 1 })
      return () => io?.disconnect()
    }

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=150%',
        pin: true,
        scrub: true,
        onUpdate: (self) => stageView.set({ progress: self.progress }),
      })
      const title = section.querySelector('h1')
      if (title) {
        const split = SplitText.create(title, { type: 'lines,chars', mask: 'lines' })
        gsap.from(split.chars, { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.02 })
      }
    }, section)

    return () => {
      ctx.revert()
      io?.disconnect()
    }
  }, [])

  const built = assembledCount(stage, progress)

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 -z-10">
      <StageSvg
        stage={stage}
        hue={hue}
        className={`absolute inset-x-0 top-[14%] mx-auto h-[55%] w-full transition-opacity duration-700 ${webglReady ? 'opacity-0' : 'opacity-100'}`}
      />
      <p className="sr-only">
        An illustrated concert stage — truss towers, a lighting rig and speaker stacks — assembles as you scroll. Its
        lights follow the show console.
      </p>
      <div className="label absolute right-5 top-6 space-y-1 text-right md:right-10" aria-hidden="true">
        <p>ASSEMBLY {String(Math.round(progress * 100)).padStart(3, '0')}%</p>
        <p>
          PARTS {built}/{stage.parts.length}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Put it in the hero — `app/page.tsx`**

Add `import { HeroStage } from '@/components/sections/HeroStage'` and replace the cue-1 line with:
```tsx
      <Section cue={1} level={1} className="relative isolate flex min-h-[calc(100svh-var(--console-h))] flex-col justify-end">
        <HeroStage />
      </Section>
```

- [ ] **Step 9: Keep the page test on the mock — `app/page.test.tsx`**

Add `import { vi } from 'vitest'` (merge with the existing vitest import) and `vi.mock('@/lib/gsap')` below the imports.

- [ ] **Step 10: Run tests and checks**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm build` → all pass.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(hero): pin the hero and assemble the stage on scroll"
```

---

## Task 6: Cue LED stays put during a glide

**Files:**
- Modify: `lib/scroll.ts`, `console/useCueTracking.ts`, `lib/scroll.test.ts`, `components/console/Console.test.tsx` (mock shape)

**Interfaces:**
- Consumes: Lenis `scrollTo(target, { duration, onComplete })`.
- Produces: `isGliding(): boolean` — true from a `scrollToCue` call until the glide ends (Lenis `onComplete`, native `scrollend`, instant jump under reduced motion, or a 1600 ms safety timeout). `useCueTracking` ignores intersections while gliding.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c fix/cue-glide-flicker
```

- [ ] **Step 2: Update the tests in `lib/scroll.test.ts`**

Change the existing Lenis assertion to
```ts
    expect(scrollTo).toHaveBeenCalledWith(document.getElementById('cue-3'), expect.objectContaining({ duration: 1.2 }))
```
import `isGliding` alongside the other imports, and add:
```ts
  it('reports a glide until Lenis completes', () => {
    let done: (() => void) | undefined
    setLenis({ scrollTo: (_el: unknown, opts: { onComplete: () => void }) => (done = opts.onComplete) } as unknown as Lenis)
    scrollToCue(3)
    expect(isGliding()).toBe(true)
    done!()
    expect(isGliding()).toBe(false)
  })

  it('reports a native smooth glide until scrollend', () => {
    scrollToCue(3)
    expect(isGliding()).toBe(true)
    window.dispatchEvent(new Event('scrollend'))
    expect(isGliding()).toBe(false)
  })

  it('does not report a glide for an instant reduced-motion jump', () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({ matches: true } as MediaQueryList)
    scrollToCue(3)
    expect(isGliding()).toBe(false)
  })

  it('ends a glide after a safety timeout if no end event arrives', () => {
    vi.useFakeTimers()
    scrollToCue(3)
    vi.advanceTimersByTime(1600)
    expect(isGliding()).toBe(false)
    vi.useRealTimers()
  })

  it('does not start a glide when the section is missing', () => {
    scrollToCue(9)
    expect(isGliding()).toBe(false)
  })
```
Also add `window.dispatchEvent(new Event('scrollend'))` at the end of the existing `afterEach` so a glide never leaks between tests.

- [ ] **Step 3: Run to verify they fail**

Run: `pnpm test lib/scroll.test.ts`
Expected: FAIL (`isGliding` is not exported).

- [ ] **Step 4: Replace `lib/scroll.ts`**

```ts
import type Lenis from 'lenis'

let lenis: Lenis | null = null
let gliding = false
let safety: number | undefined

export function setLenis(instance: Lenis | null) {
  lenis = instance
}

/** True while a cue-triggered scroll is still travelling. */
export const isGliding = () => gliding

function endGlide() {
  gliding = false
  window.clearTimeout(safety)
  window.removeEventListener('scrollend', endGlide)
}

function startGlide() {
  gliding = true
  window.clearTimeout(safety)
  safety = window.setTimeout(endGlide, 1600)
}

export function scrollToCue(n: number): boolean {
  const el = document.getElementById(`cue-${n}`)
  if (!el) return false

  if (lenis) {
    startGlide()
    lenis.scrollTo(el, { duration: 1.2, onComplete: endGlide })
  } else if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    endGlide()
    el.scrollIntoView({ behavior: 'auto' })
  } else {
    startGlide()
    window.addEventListener('scrollend', endGlide, { once: true })
    el.scrollIntoView({ behavior: 'smooth' })
  }
  el.focus({ preventScroll: true })
  return true
}
```

- [ ] **Step 5: Ignore intersections while gliding — `console/useCueTracking.ts`**

Add `import { isGliding } from '@/lib/scroll'` and change the inner condition to:
```ts
          if (entry.isIntersecting && !isGliding()) consoleStore.setValue('activeCue', Number(entry.target.getAttribute('data-cue')))
```

`components/console/Console.test.tsx` mocks `@/lib/scroll`; add the new export to that mock so the module shape stays complete:
```tsx
vi.mock('@/lib/scroll', () => ({ scrollToCue: vi.fn(() => true), isGliding: () => false }))
```

- [ ] **Step 6: Run tests and checks**

Run: `pnpm test && pnpm lint && pnpm typecheck` → all pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix(console): keep the pressed cue lit while the scroll glides"
```

---

## Task 7: Manifesto and console-driven CSS variables

**Files:**
- Create: `components/ConsoleCssVars.tsx`, `components/sections/Manifesto.tsx`
- Modify: `app/layout.tsx` (mount ConsoleCssVars), `app/page.tsx` (use Manifesto), `app/globals.css` (manifesto styles)
- Test: `components/ConsoleCssVars.test.tsx`

**Interfaces:**
- Consumes: `consoleStore` (Stage 1); `gsap`, `SplitText` (Task 5).
- Produces: `<ConsoleCssVars />` keeps `--master` (0–1) and `--hue` (0–360) on `<html>` in sync with the console; `<Manifesto lines={string[]} />`.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/manifesto
```

- [ ] **Step 2: Write the failing test `components/ConsoleCssVars.test.tsx`**

```tsx
import { act, render } from '@testing-library/react'
import { beforeEach, expect, it } from 'vitest'
import { consoleStore } from '@/console/store'
import { ConsoleCssVars } from './ConsoleCssVars'

beforeEach(() => consoleStore.reset())

it('mirrors master and hue onto <html> as CSS variables', () => {
  render(<ConsoleCssVars />)
  const style = document.documentElement.style
  expect(style.getPropertyValue('--master')).toBe('0.8')
  expect(style.getPropertyValue('--hue')).toBe('8')
  act(() => consoleStore.set({ master: 0.25, hue: 200 }))
  expect(style.getPropertyValue('--master')).toBe('0.25')
  expect(style.getPropertyValue('--hue')).toBe('200')
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm test components/ConsoleCssVars.test.tsx` → FAIL (module missing).

- [ ] **Step 4: Create `components/ConsoleCssVars.tsx`**

```tsx
'use client'

import { useEffect } from 'react'
import { consoleStore } from '@/console/store'

/** Exposes console values to CSS so typography can react without React re-renders. */
export function ConsoleCssVars() {
  useEffect(() => {
    const apply = () => {
      const { master, hue } = consoleStore.get()
      const style = document.documentElement.style
      style.setProperty('--master', String(master))
      style.setProperty('--hue', String(hue))
    }
    apply()
    return consoleStore.subscribe(apply)
  }, [])
  return null
}
```

- [ ] **Step 5: Create `components/sections/Manifesto.tsx`**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { gsap, SplitText } from '@/lib/gsap'

/** Words fill in from outline as the section scrolls through, like lights being raised. */
export function Manifesto({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      const split = SplitText.create(el.querySelectorAll('p'), { type: 'words' })
      gsap.fromTo(
        split.words,
        { color: 'rgba(237, 235, 230, 0)' },
        {
          color: 'rgba(237, 235, 230, 1)',
          ease: 'none',
          stagger: 0.05,
          scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 45%', scrub: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className="manifesto mt-12 max-w-5xl space-y-2">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  )
}
```

- [ ] **Step 6: Styles — append to `app/globals.css`**

```css
.manifesto {
  font-size: clamp(1.75rem, 4.5vw, 4rem);
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
  font-stretch: calc(62% + var(--master, 0.8) * 63%);
  -webkit-text-stroke: 1px var(--color-ink);
  transition: font-stretch 200ms var(--ease-mechanical);
}
```

- [ ] **Step 7: Wire up**

`app/layout.tsx`: `import { ConsoleCssVars } from '@/components/ConsoleCssVars'` and render `<ConsoleCssVars />` right after `<SmoothScroll />`.

`app/page.tsx`: `import { Manifesto } from '@/components/sections/Manifesto'` and replace the cue-2 children with `<Manifesto lines={agency.manifesto} />`.

- [ ] **Step 8: Run tests and checks**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm build` → all pass.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(home): add scroll-filled manifesto whose width follows the master fader"
```

---

## Task 8: Work, Services and Contact sections

**Files:**
- Create: `components/sections/WorkList.tsx`, `components/sections/ServiceRack.tsx`, `components/sections/ContactBlock.tsx`
- Modify: `app/page.tsx`, `app/globals.css`
- Test: `components/sections/WorkList.test.tsx`, `components/sections/ServiceRack.test.tsx`, `components/sections/ContactBlock.test.tsx`

**Interfaces:**
- Consumes: `shows`, `Show` (Task 1); `generateStage` (Task 1); `StageSvg` (Task 2); `agency` (Stage 1); `useConsole` (Stage 1).
- Produces: `<WorkList shows={Show[]} />`, `<ServiceRack services={Service[]} />`, `<ContactBlock />`, `formatCityTime(date: Date, timeZone: string): string` (`HH:MM`, 24 h).

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/home-sections
```

- [ ] **Step 2: Write the failing tests**

`components/sections/WorkList.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { shows } from '@/content/shows'
import { WorkList } from './WorkList'

it('lists every show with its facts', () => {
  render(<WorkList shows={shows} />)
  expect(screen.getAllByRole('listitem')).toHaveLength(shows.length)
  expect(screen.getByRole('heading', { name: 'Night Signal' })).toBeInTheDocument()
  expect(screen.getByText('18,000 cap.')).toBeInTheDocument()
})

it('powers on the hovered row and previews its stage', () => {
  const { container } = render(<WorkList shows={shows} />)
  const row = screen.getAllByRole('listitem')[1]
  fireEvent.pointerEnter(row)
  expect(row).toHaveAttribute('data-active', 'true')
  expect(container.querySelector('.work-preview svg')).not.toBeNull()
  fireEvent.pointerLeave(container.firstElementChild!)
  expect(row).toHaveAttribute('data-active', 'false')
})
```

`components/sections/ServiceRack.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { agency } from '@/content/agency'
import { ServiceRack } from './ServiceRack'

it('expands a rack unit with its toggle', () => {
  render(<ServiceRack services={agency.services} />)
  const toggles = screen.getAllByRole('button', { name: 'Details' })
  expect(toggles).toHaveLength(agency.services.length)
  const first = toggles[0]
  expect(first).toHaveAttribute('aria-expanded', 'false')
  expect(screen.queryByText(agency.services[0].details[0])).not.toBeVisible()
  fireEvent.click(first)
  expect(first).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByText(agency.services[0].details[0])).toBeVisible()
})
```

`components/sections/ContactBlock.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ContactBlock, formatCityTime } from './ContactBlock'

describe('formatCityTime', () => {
  it('formats 24 h local time in the given zone', () => {
    expect(formatCityTime(new Date('2026-01-15T00:30:00Z'), 'Australia/Melbourne')).toBe('11:30')
    expect(formatCityTime(new Date('2026-07-15T13:05:00Z'), 'Australia/Melbourne')).toBe('23:05')
  })
})

describe('ContactBlock', () => {
  it('offers the email once to assistive tech and a booking link', () => {
    render(<ContactBlock />)
    expect(screen.getByRole('link', { name: 'Email hello@example.com' })).toHaveAttribute('href', 'mailto:hello@example.com')
    expect(screen.getByRole('link', { name: 'Book a show' })).toHaveAttribute('href', expect.stringContaining('mailto:hello@example.com'))
  })
})
```

- [ ] **Step 3: Run to verify they fail**

Run: `pnpm test components/sections/` → FAIL on missing modules.

- [ ] **Step 4: Create `components/sections/WorkList.tsx`**

```tsx
'use client'

import { useMemo, useRef, useState } from 'react'
import { useConsole } from '@/console/store'
import type { Show } from '@/content/shows'
import { generateStage } from '@/stage/generateStage'
import { StageSvg } from '@/stage/StageSvg'

export function WorkList({ shows }: { shows: Show[] }) {
  const [active, setActive] = useState<string | null>(null)
  const preview = useRef<HTMLDivElement>(null)
  const hue = useConsole((s) => s.hue)
  const stages = useMemo(() => new Map(shows.map((s) => [s.slug, generateStage(s.seed)])), [shows])
  const activeStage = active ? stages.get(active) : undefined

  return (
    <div
      className="relative mt-12"
      onPointerMove={(e) => {
        const el = preview.current
        if (!el) return
        const box = e.currentTarget.getBoundingClientRect()
        el.style.transform = `translate(${e.clientX - box.left + 24}px, ${e.clientY - box.top - 80}px)`
      }}
      onPointerLeave={() => setActive(null)}
    >
      <ol className="border-t border-line">
        {shows.map((s, i) => (
          <li
            key={s.slug}
            data-active={active === s.slug}
            onPointerEnter={() => setActive(s.slug)}
            className="work-row grid grid-cols-[3rem_1fr] items-baseline gap-x-4 gap-y-1 border-b border-line py-5 md:grid-cols-[4rem_minmax(0,2fr)_1fr_5rem_7rem_8rem]"
          >
            <span className="label">
              <span className="led" data-on={active === s.slug} aria-hidden="true" />
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="work-name text-[clamp(1.5rem,4vw,3.5rem)] font-extrabold uppercase leading-none">{s.name}</h3>
            <span className="label col-start-2 md:col-start-auto">{s.city}</span>
            <span className="label col-start-2 md:col-start-auto">{s.date.slice(0, 4)}</span>
            <span className="label col-start-2 md:col-start-auto">{s.type}</span>
            <span className="label col-start-2 md:col-start-auto">{s.capacity.toLocaleString('en-AU')} cap.</span>
          </li>
        ))}
      </ol>
      <div
        ref={preview}
        aria-hidden="true"
        data-visible={activeStage !== undefined}
        className="work-preview pointer-events-none absolute left-0 top-0 hidden h-40 w-64 border border-line bg-panel p-3 md:block"
      >
        {activeStage && <StageSvg stage={activeStage} hue={hue} className="h-full w-full" />}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Create `components/sections/ServiceRack.tsx`**

```tsx
'use client'

import { useId, useState } from 'react'
import type { Service } from '@/content/agency'

function RackUnit({ service }: { service: Service }) {
  const [open, setOpen] = useState(false)
  const detailsId = useId()
  const titleId = useId()

  return (
    <li className="rack-unit relative border border-line bg-panel p-6">
      <span className="rack-screw left-2 top-2" aria-hidden="true" />
      <span className="rack-screw right-2 top-2" aria-hidden="true" />
      <span className="rack-screw bottom-2 left-2" aria-hidden="true" />
      <span className="rack-screw bottom-2 right-2" aria-hidden="true" />
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="label">{service.id}</p>
          <h3 id={titleId} className="mt-2 text-2xl font-bold uppercase">
            {service.title}
          </h3>
          <p className="mt-2 text-mute">{service.summary}</p>
        </div>
        <button
          type="button"
          className="rack-toggle"
          aria-expanded={open}
          aria-controls={detailsId}
          aria-describedby={titleId}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="led" data-on={open} aria-hidden="true" />
          Details
        </button>
      </div>
      <ul id={detailsId} hidden={!open} className="label mt-4 space-y-1">
        {service.details.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </li>
  )
}

export function ServiceRack({ services }: { services: Service[] }) {
  return (
    <ul className="mt-12 grid gap-4 md:grid-cols-2">
      {services.map((s) => (
        <RackUnit key={s.id} service={s} />
      ))}
    </ul>
  )
}
```

- [ ] **Step 6: Create `components/sections/ContactBlock.tsx`**

```tsx
'use client'

import { useEffect, useState } from 'react'
import { agency } from '@/content/agency'

export function formatCityTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(date)
}

export function ContactBlock() {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    const tick = () => setTime(formatCityTime(new Date(), 'Australia/Melbourne'))
    const first = window.setTimeout(tick, 0)
    const every = window.setInterval(tick, 30_000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(every)
    }
  }, [])

  return (
    <div className="mt-12">
      <a href={`mailto:${agency.email}`} aria-label={`Email ${agency.email}`} className="marquee block overflow-hidden border-y border-line py-6">
        <span className="marquee-track" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className="marquee-item">
              {agency.email} —
            </span>
          ))}
        </span>
      </a>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
        <a href={`mailto:${agency.email}?subject=Book%20a%20show`} className="book-button">
          Book a show
        </a>
        <p className="label">
          <span className="led" data-on="true" aria-hidden="true" />
          Show status: live · {agency.city} {time ?? '--:--'}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Styles — append to `app/globals.css`**

```css
/* Work list */
.work-name {
  font-stretch: 75%;
  transition: font-stretch 300ms var(--ease-mechanical), color 150ms var(--ease-mechanical);
}

.work-row[data-active='true'] .work-name {
  font-stretch: 125%;
  color: var(--color-led);
}

.work-preview {
  opacity: 0;
  transition: opacity 150ms var(--ease-mechanical);
}

.work-preview[data-visible='true'] {
  opacity: 1;
}

/* Shared LED (also defined in console.css for the console bundle) */
.led {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 6px;
  vertical-align: middle;
  background: #3a1a14;
}

.led[data-on='true'] {
  background: var(--color-led);
  box-shadow: 0 0 6px var(--color-led);
}

/* Rack units */
.rack-screw {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #2a2a2a;
  box-shadow: inset 0 1px 0 #000;
}

.rack-toggle {
  flex: none;
  padding: 8px 10px;
  border: 1px solid var(--color-line);
  background: #141414;
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  box-shadow: inset 0 -2px 0 #000;
}

.rack-toggle:active {
  transform: translateY(2px);
  box-shadow: none;
}

/* Contact */
.marquee-track {
  display: flex;
  width: max-content;
  animation: marquee 18s linear infinite;
}

.marquee:hover .marquee-track,
.marquee:focus-visible .marquee-track {
  animation-play-state: paused;
}

.marquee-item {
  padding-right: 3rem;
  font-size: clamp(2rem, 7vw, 6rem);
  font-weight: 800;
  white-space: nowrap;
}

@keyframes marquee {
  to {
    transform: translateX(-50%);
  }
}

.book-button {
  display: inline-block;
  padding: 18px 28px;
  background: var(--color-led);
  color: var(--color-stage);
  font-family: var(--font-mono);
  font-size: 14px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  box-shadow: inset 0 -4px 0 rgba(0, 0, 0, 0.35);
  transition: transform 80ms var(--ease-mechanical), box-shadow 80ms var(--ease-mechanical);
}

.book-button:active {
  transform: translateY(4px);
  box-shadow: none;
}

@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none;
  }
}
```

- [ ] **Step 8: Use the sections — `app/page.tsx`**

Import `WorkList`, `ServiceRack`, `ContactBlock` and `shows`; then:
- cue 3: `<Section cue={3}><WorkList shows={shows} /></Section>`
- cue 4: replace the inline services list with `<ServiceRack services={agency.services} />`
- cue 5: replace the email link with `<ContactBlock />`

- [ ] **Step 9: Run tests and checks**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm build` → all pass.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(home): add work index with stage previews, rack-unit services and contact block"
```

---

## Task 9: Safari audio (issue #14) — investigate, then fix

**Status:** blocked on evidence. Chrome on the same MacBook plays every pad, so the "laptop speakers can't reproduce low frequencies" hypothesis is refuted; the sound design stays as specified. Safari plays nothing. No fix is written until the Safari probe below has been run (systematic-debugging: no fix without a root cause).

**Files:** decided after the probe (expected: `console/audio.ts`, maybe `components/console/SoundToggle.tsx`).

- [ ] **Step 1: PM runs the probe in Safari** (Develop → Show JavaScript Console on http://localhost:3000 or the Vercel preview), pastes this, presses Sound, presses Kick, then runs `__report()` and copies the console output into issue #14 together with the Safari version:

```js
(() => {
  const Orig = window.AudioContext
  window.__ctxs = []
  window.AudioContext = class extends Orig {
    constructor(...args) {
      super(...args)
      window.__ctxs.push(this)
      this.addEventListener('statechange', () => console.log('[audio] state →', this.state))
    }
  }
  window.__report = () => {
    const c = window.__ctxs[0]
    console.log('[audio] contexts:', window.__ctxs.length, '| state:', c?.state, '| time:', c?.currentTime, '| rate:', c?.sampleRate)
    console.log('[audio] buttons:', [...document.querySelectorAll('.sound-toggle')].map((b) => b.textContent + ' pressed=' + b.getAttribute('aria-pressed')).join(', '))
  }
  console.log('[audio] probe ready: press Sound, then Kick, then run __report()')
})()
```

- [ ] **Step 2: Controller states one hypothesis from the output**, e.g.
  - 0 contexts → the click never reached `initAudio` (event / gesture path)
  - state `suspended` or `interrupted`, button "On" → resume not honoured; resume inside the gesture or on the next pointerdown
  - button stays "Off" → `initAudio` never resolved (`resume()` pending) or returned false
  - state `running`, `time` advancing, still silent → graph/scheduling issue (node chaining, ramps from `currentTime`)
- [ ] **Step 3: Failing test where possible** (e.g. a fake `AudioContext` reproducing the observed Safari behaviour in `console/audio.test.ts`), then the smallest fix, PR with `Closes #14` after the PM hears it in Safari.


---

## Stage 2 checkpoint (PM review)

- [ ] Hero: scroll — stage flies together part by part, lights switch on at the end, HUD counts to 100%, title letters rise on load.
- [ ] Console → stage: Hue recolours beams and lenses, Master/Intensity dim them, Tempo speeds the chase, Fog thickens haze, pads flash the rig (even with sound off).
- [ ] Manifesto words fill from outline while scrolling; Master fader stretches/condenses the type.
- [ ] Work rows light up and show a stage preview on hover; Services toggles open; email marquee pauses on hover; Melbourne time shows.
- [ ] Press CUE 05 from the top: the cue LED jumps straight to 05 (no flicker through 02–04).
- [ ] Reduced motion: hero not pinned, stage assembled, no marquee, no text animation.
- [ ] DevTools → disable WebGL (or `chrome://flags` "WebGL" off): hero shows the line-drawn SVG stage.
- [ ] Safari: pads audible after Sound (then close #14).
- [ ] **Go / no-go: procedural stage good enough, or switch the hero to a Blender GLB?** (spec §13 risk)
