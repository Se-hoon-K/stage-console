# Stage 4 — The Show Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give the assembled, lit stage a real viewing window (a scrubbed "show" phase plus the stage staying on as the Manifesto's backdrop) and replace the primitive lights and boxes with credited third-party 3D models and soft volumetric beams.

**Architecture:** The scroll progress the hero already drives (`stageView.progress`, 0–1) is re-cut into three phases: assembly, lights, show. Phase maths lives in pure functions in `stage/` (unit-tested) and `webgl/StageScene.tsx` only reads them. Canvas visibility becomes a union of every registered section (hero + backdrop sections). Models are optimised GLBs fetched only after the canvas mounts; each model flattens to one `InstancedMesh` per sub-mesh, and the current procedural geometry stays as the fallback.

**Tech Stack:** Next.js 16.4, React 19, R3F 9.8, three 0.186 (`GLTFLoader`, `MeshoptDecoder`, `RoomEnvironment` from `three/examples/jsm`), GSAP ScrollTrigger, Vitest. Asset optimisation with `npx @gltf-transform/cli` (dev-time only, not a dependency).

**Spec:** `docs/superpowers/specs/portfolio-design.md` (§ stage, § perf budget, § a11y). Stage 4 decisions are in this plan's Context.

## Context

PM feedback after Stage 3:
1. The lit stage is visible for about 0.3 screens of scroll. The hero pins for `+=150%`, parts assemble over 0–0.8, lights switch on over 0.8–1.0, then the opaque Manifesto covers the canvas.
2. The lights look cheap. Fixtures are spheres and beams are flat additive cones.

PM decisions: a longer pinned show **and** the stage staying on behind the Manifesto; credited third-party models (CC BY / CC BY-NC allowed, no ND, no paid) plus better beam shaders.

## Global Constraints

- Lighthouse desktop (GPU, quiet machine) stays 100 / 100 / 100 / 100, with TBT ≤ 50 ms and CLS 0.
- First-load JS for `/` ≤ 250 KB gzip. Models and loaders load only inside the lazy 3D chunk, after the canvas mounts.
- Model budget: each GLB ≤ 250 KB, all GLBs ≤ 1 MB.
- No new runtime dependencies.
- Reduced motion: no pin, stage shown fully assembled and lit, no camera or beam motion.
- No WebGL: the SVG stage stays, and no models are fetched.
- The pin keeps the React-owned `data-pin-spacer` + `pinSpacer` and `pinSpacing: 'padding'`.
- Route transitions keep working (home → event → back, event → event).
- Every third-party model is credited with title, author, source URL, exact licence and "modified (optimised)".
- Commits: Conventional Commits, no `Co-Authored-By` trailer. PR bodies: no "Generated with Claude Code" footer.

## Review Focus

1. **Pin length vs the CSS reservation.** `useStageSection`'s default `end` and the `[data-pin-spacer]` `padding-bottom` must stay equal (`+=300%` ↔ `300svh`), or content jumps at hydration. Task 1 adds a test that reads both values.
2. **Leaving the hero mid-show and coming back.** Scrolling back up from Manifesto must not leave the canvas paused or the stage stuck at the wrong phase. Task 2's union test covers hero-off/backdrop-on/backdrop-off.
3. **Model fails to load (404, offline, decode error).** The stage must still render with the procedural geometry, without throwing. Task 4 tests a rejecting loader.
4. **Seed change while models load.** Navigating home → event before the GLBs arrive must not place instances for the old seed. Task 5 builds instances from the current `parts` on every frame, and the models are seed-independent.
5. **Phone (390 px) and lite mode.** The longer pin must still feel right on touch scrolling, and the haze and beam shader must not tank mobile GPUs. The controller's CDP phone run checks frame time and the absence of errors.

---

### Task 1: Show phase — longer pin, retimed assembly, scrubbed show

**Files:**
- Modify: `stage/assembly.ts`, `stage/assembly.test.ts`
- Modify: `stage/lighting.ts`, `stage/lighting.test.ts`
- Modify: `stage/useStageSection.ts`, `stage/useStageSection.test.tsx`
- Modify: `app/globals.css` (pin reservation, hero title)
- Modify: `webgl/StageScene.tsx` (camera, beam aim, haze)
- Modify: `components/sections/HeroStage.tsx`, `components/event/EventStage.tsx` (HUD phase label)

**Interfaces:**
- Produces in `stage/assembly.ts`:
  - `export const ASSEMBLY_END = 0.45`
  - `export const LIGHTS_END = 0.55`
  - `export const PIN_LENGTH = 300` (percent of viewport; the single source for `end` and the CSS comment)
  - `export function showProgress(progress: number): number`
  - `export type StagePhase = 'ASSEMBLY' | 'LIGHTS' | 'SHOW'`
  - `export function stagePhase(progress: number): StagePhase`
- Produces in `stage/lighting.ts`: `export function beamAim(args: { show: number; index: number; count: number; time: number; reduced: boolean }): { pan: number; tilt: number }` (radians)

- [ ] **Step 1: Write the failing tests** — append to `stage/assembly.test.ts`, and update the two existing literals that encode the old timing:

```ts
// in describe('partOffset'): the old literal 0.5 * 0.65 + 0.15 becomes the new SPREAD/TRAVEL
expect(partOffset(0.5 * 0.35 + 0.1, 0.5)).toBeCloseTo(0)

// in describe('lightsOn') 'switches lights on one after another':
expect(lightsOn(0.5, 0, 10)).toBe(1)
expect(lightsOn(0.5, 9, 10)).toBe(0)

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
```

Update the import line to `import { ASSEMBLY_END, LIGHTS_END, assembledCount, lightsOn, partOffset, showProgress, snapEase, stagePhase } from './assembly'`.

Append to `stage/lighting.test.ts` (import `beamAim` alongside `lightLevel`):

```ts
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
```

Append to `stage/useStageSection.test.tsx` (the review-requested tests; add `import { readFileSync } from 'node:fs'` and `import { PIN_LENGTH } from './assembly'`):

```ts
it('pins with explicit padding spacing and the shared default length', () => {
  render(<Probe seed={7} />)
  const config = vi.mocked(ScrollTrigger.create).mock.calls.at(-1)![0] as unknown as { pinSpacing: string; end: string }
  expect(config.pinSpacing).toBe('padding')
  expect(config.end).toBe(`+=${PIN_LENGTH}%`)
})

it('reserves exactly the default pin length in CSS (no jump at hydration)', () => {
  const css = readFileSync('app/globals.css', 'utf8')
  expect(css).toMatch(new RegExp(`\\[data-pin-spacer\\]\\s*{\\s*padding-bottom:\\s*${PIN_LENGTH}svh`))
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm test stage`
Expected: FAIL (missing exports `LIGHTS_END`, `showProgress`, `stagePhase`, `beamAim`, `PIN_LENGTH`; old timing literals).

- [ ] **Step 3: Implement the phase maths** — `stage/assembly.ts`:

```ts
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
```

`stage/lighting.ts` — add below `lightLevel`:

```ts
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
```

- [ ] **Step 4: Pin length and CSS** — in `stage/useStageSection.ts` change the signature to

```ts
import { PIN_LENGTH } from './assembly'
// …
export function useStageSection(ref: RefObject<HTMLElement | null>, { seed, end = `+=${PIN_LENGTH}%` }: Options) {
```

In `app/globals.css` change the reservation block to:

```css
/* Reserve the pin's scroll length (PIN_LENGTH in stage/assembly.ts, used as useStageSection's end)
   before ScrollTrigger adds it at hydration, so the content below does not jump. Only where the pin
   will exist: JS on, motion allowed. */
@media (prefers-reduced-motion: no-preference) {
  [data-js] [data-pin-spacer] {
    padding-bottom: 300svh;
  }
}
```

The Step 1 regex looks for `[data-pin-spacer] {` followed by `padding-bottom: 300svh` — it matches this block (the `display:flex` block has no padding). If the regex trips on the selector prefix `[data-js] `, it still matches because the regex is unanchored.

Hero title: it must be out of the way early in the longer pin. Replace the `#cue-1 h1` block:

```css
/* Hero title rises and dims in the first quarter of the pin (decision a), leaving the stage clear for
   the lights and the show. --assembly is 0–1, set by useStageSection. */
#cue-1 h1 {
  --title-out: min(1, calc(var(--assembly, 0) * 4));
  transform: translateY(calc(var(--title-out) * -22vh));
  opacity: calc(1 - var(--title-out) * 0.85);
  will-change: transform, opacity;
}
```

- [ ] **Step 5: Scene — camera, beam aim, haze** in `webgl/StageScene.tsx`:
  - Import `ASSEMBLY_END, lightsOn, partOffset, showProgress` and `beamAim, lightLevel`.
  - In `Rig`'s frame loop, compute `const show = showProgress(progress)` once. Replace the beam rotation line `obj.rotation.set(0, 0, hung && !reduced ? Math.sin(time * 0.6 + i) * 0.25 : 0)` with:

```ts
const aim = hung ? beamAim({ show, index: i, count: lights.length, time, reduced }) : { pan: 0, tilt: 0 }
obj.rotation.set(aim.tilt, 0, aim.pan) // tilt about x leans the beam toward the audience (+z)
```

  - In `StageScene`'s frame loop replace the camera block:

```ts
const p = Math.min(progress / ASSEMBLY_END, 1)
const show = showProgress(progress)
const live = progress >= ASSEMBLY_END && !reduced
const fitZ = fitDistance(stage.bounds[0], (state.camera as THREE.PerspectiveCamera).fov, state.size.width / state.size.height)
const startZ = Math.max(30, fitZ * 1.4)
const endZ = Math.max(19, fitZ)
// Show: arc ~25° around the stage and push in 20%.
const angle = (reduced ? 0 : show) * THREE.MathUtils.degToRad(25)
const dist = (startZ + (endZ - startZ) * p) * (1 - 0.2 * (reduced ? 0 : show))
camTarget.set(
  Math.sin(angle) * dist + (live ? state.pointer.x * 0.8 : 0),
  7 - 2.5 * p - 1 * show + (live ? state.pointer.y * 0.4 : 0),
  Math.cos(angle) * dist,
)
```

  (keep the `lerp` and `lookAt(0, 3, 0)` lines as they are).
  - Haze: `fogRef.current.density = 0.006 + c.fog * 0.035 + show * 0.01`.

- [ ] **Step 6: HUD phase label** — in `HeroStage.tsx` and `EventStage.tsx` import `stagePhase` and change the first HUD line to

```tsx
<p>
  {stagePhase(percent / 100)} {String(percent).padStart(3, '0')}%
</p>
```

- [ ] **Step 7: Run tests, typecheck, lint**

Run: `pnpm test && pnpm typecheck && pnpm lint`
Expected: all pass. Fix any other test that pinned the old timing (search `0.8` / `0.85` in `*.test.*` under `stage/`, `webgl/`, `components/`).

- [ ] **Step 8: Commit**

```bash
git add stage app/globals.css webgl/StageScene.tsx components/sections/HeroStage.tsx components/event/EventStage.tsx
git commit -m "feat(stage): 3-screen pin with assembly, lights and a scrubbed show phase"
```

---

### Task 2: The stage stays on behind the Manifesto

**Files:**
- Modify: `stage/view.ts`, `stage/view.test.ts`
- Modify: `stage/useStageSection.ts`, `stage/useStageSection.test.tsx`
- Create: `stage/useStageBackdrop.ts`, `stage/useStageBackdrop.test.tsx`
- Modify: `components/Section.tsx` (opt-out of the opaque background)
- Modify: `components/sections/Manifesto.tsx`, `app/page.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `stageView` (`stage/view.ts`).
- Produces in `stage/view.ts`: `export function showStageFor(owner: object, on: boolean): void` — registers/unregisters a visibility source; `stageView.visible` becomes `true` while any registered owner is on.
- Produces: `export function useStageBackdrop(ref: RefObject<HTMLElement | null>): void`.
- `Section` gains `bare?: boolean` (no `bg-stage`; border stays).

- [ ] **Step 1: Failing tests** — append to `stage/view.test.ts` (import `showStageFor`):

```ts
describe('showStageFor', () => {
  it('is visible while any owner is on, hidden when all are off', () => {
    const hero = {}
    const backdrop = {}
    showStageFor(hero, true)
    expect(stageView.get().visible).toBe(true)
    showStageFor(backdrop, true)
    showStageFor(hero, false)
    expect(stageView.get().visible).toBe(true)
    showStageFor(backdrop, false)
    expect(stageView.get().visible).toBe(false)
  })

  it('treats repeated calls for the same owner as one source', () => {
    const a = {}
    showStageFor(a, true)
    showStageFor(a, true)
    showStageFor(a, false)
    expect(stageView.get().visible).toBe(false)
  })
})
```

`stage/view.ts` `reset` must also clear the owners: add to the test `beforeEach` nothing new — instead `stageView.reset` is overridden (Step 3) so the existing `beforeEach(() => stageView.reset())` clears it.

`stage/useStageBackdrop.test.tsx`:

```tsx
import { render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stageView } from './view'
import { useStageBackdrop } from './useStageBackdrop'

let callback: IntersectionObserverCallback
const disconnect = vi.fn()
class IO {
  constructor(cb: IntersectionObserverCallback) {
    callback = cb
  }
  observe() {}
  disconnect = disconnect
}

function Probe() {
  const ref = useRef<HTMLElement>(null)
  useStageBackdrop(ref)
  return <section ref={ref} />
}

describe('useStageBackdrop', () => {
  beforeEach(() => {
    stageView.reset()
    stageView.set({ visible: false })
    vi.stubGlobal('IntersectionObserver', IO)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('keeps the canvas visible while the section is on screen', () => {
    render(<Probe />)
    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(stageView.get().visible).toBe(true)
    callback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver)
    expect(stageView.get().visible).toBe(false)
  })

  it('releases its claim on unmount', () => {
    const { unmount } = render(<Probe />)
    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)
    unmount()
    expect(disconnect).toHaveBeenCalled()
    expect(stageView.get().visible).toBe(false)
  })
})
```

In `stage/useStageSection.test.tsx` the existing 'hands the canvas back on unmount' test keeps passing unchanged (it sets `visible: true` directly; with owners the unmount must still end `false` — Step 3 makes `showStageFor(owner,false)` recompute from owners, and `stageView.set({visible:true})` from the test is not an owner, so recomputing gives `false`).

- [ ] **Step 2: Run, confirm failure** — `pnpm test stage/view stage/useStageBackdrop` → FAIL (no `showStageFor`, no module).

- [ ] **Step 3: Implement** — `stage/view.ts`:

```ts
import { agency } from '@/content/agency'
import { createStore } from '@/lib/store'

export type StageViewState = { seed: number; progress: number; visible: boolean; webglReady: boolean }

const base = createStore<StageViewState>({ seed: agency.heroSeed, progress: 0, visible: true, webglReady: false })
// Sections currently showing the canvas (the pinned stage, backdrop sections). Visible while any is on.
const owners = new Set<object>()

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
  reset() {
    owners.clear()
    base.reset()
  },
}

export function showStageFor(owner: object, on: boolean) {
  if (on) owners.add(owner)
  else owners.delete(owner)
  base.set({ visible: owners.size > 0 })
}

export const useStageView = base.use
```

(If `createStore` has no `reset`, check `lib/store.ts` — the existing tests call `stageView.reset()`, so it exists.)

`stage/useStageSection.ts`: replace the two `stageView.set({ visible: … })` uses:

```ts
io = new IntersectionObserver(([entry]) => showStageFor(section, entry.isIntersecting))
// …and in both cleanups:
showStageFor(section, false)
```

`stage/useStageBackdrop.ts`:

```ts
'use client'

import { type RefObject, useEffect } from 'react'
import { showStageFor } from './view'

/** Keeps the stage canvas running behind a section whose background is see-through. */
export function useStageBackdrop(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = ref.current?.closest('section') ?? ref.current
    if (!node || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([entry]) => showStageFor(node, entry.isIntersecting))
    io.observe(node)
    return () => {
      io.disconnect()
      showStageFor(node, false)
    }
  }, [ref])
}
```

- [ ] **Step 4: See-through Manifesto**
  - `components/Section.tsx`: add `bare?: boolean` to `Props`; class becomes ``${cue === 1 ? '' : `border-t border-line ${bare ? 'stage-backdrop' : 'bg-stage'}`} px-5 py-24 md:px-10 ${className}``.
  - `app/page.tsx`: `<Section cue={2} bare>`.
  - `components/sections/Manifesto.tsx`: call `useStageBackdrop(ref)` (the hook resolves the closest `section`).
  - `app/globals.css` — legibility scrim, transparent at the top where the hero hands over, darker under the text:

```css
/* A see-through section: the stage canvas keeps playing behind it, under a scrim that keeps text legible. */
.stage-backdrop {
  position: relative;
  background: linear-gradient(to bottom, color-mix(in oklab, var(--color-stage) 35%, transparent), color-mix(in oklab, var(--color-stage) 80%, transparent) 40%, var(--color-stage));
}
```

  Work, Services and Contact keep `bg-stage`, so the canvas is covered (and paused by the union) after the Manifesto.

- [ ] **Step 5: Run all checks** — `pnpm test && pnpm typecheck && pnpm lint` → pass.

- [ ] **Step 6: Commit**

```bash
git add stage components/Section.tsx components/sections/Manifesto.tsx app/page.tsx app/globals.css
git commit -m "feat(stage): keep the stage playing behind the manifesto"
```

---

### Task 3: Soft volumetric beams, lens flare and haze

**Files:**
- Modify: `webgl/beamMaterial.ts`
- Create: `webgl/flare.ts`
- Modify: `webgl/StageScene.tsx`

**Interfaces:**
- `createBeamMaterial()` keeps its signature and uniforms `uColor`, `uTime`, and gains `uHaze` (0–1, driven by the Fog knob). Per-instance `aLevel` stays.
- `createFlareTexture(): THREE.CanvasTexture` — radial glow + a thin horizontal streak, drawn once.

- [ ] **Step 1: Beam geometry** — in `Rig`, replace the cone with a wider, smoother open cone: `new THREE.CylinderGeometry(0.06, 0.55, 1, 48, 24, true)` translated `(0, -0.5, 0)` (narrow end at the fixture). Keep the `aLevel` attribute.

- [ ] **Step 2: Beam shader** — `webgl/beamMaterial.ts`. Pass the view-space normal and position; the fragment uses a fresnel term so the beam's core is bright and its silhouette fades, a length falloff, animated value noise for haze breakup, and faint gobo streaks around the axis:

```ts
import * as THREE from 'three'

/** Additive volumetric-looking beam: soft edges (fresnel), length falloff, drifting haze, faint gobo streaks. */
export function createBeamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color() }, uTime: { value: 0 }, uHaze: { value: 0.5 } },
    vertexShader: /* glsl */ `
      attribute float aLevel;
      varying float vLevel;
      varying float vY;
      varying vec3 vNormalV;
      varying vec3 vViewPos;
      varying vec3 vLocal;
      void main() {
        vLevel = aLevel;
        vY = position.y;
        vLocal = position;
        vec4 local = vec4(position, 1.0);
        vec3 n = normal;
        #ifdef USE_INSTANCING
          local = instanceMatrix * local;
          n = mat3(instanceMatrix) * n;
        #endif
        vec4 view = viewMatrix * modelMatrix * local;
        vViewPos = view.xyz;
        vNormalV = normalize(mat3(viewMatrix) * mat3(modelMatrix) * n);
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uTime;
      uniform float uHaze;
      varying float vLevel;
      varying float vY;
      varying vec3 vNormalV;
      varying vec3 vViewPos;
      varying vec3 vLocal;

      float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
      float noise(vec3 p) {
        vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
      }

      void main() {
        // Facing ratio: 1 where we look straight through the beam's middle, 0 at its silhouette.
        float facing = abs(dot(normalize(vNormalV), normalize(-vViewPos)));
        float soft = pow(facing, 1.6);
        // Brightest at the fixture (y = 0), fading toward the floor (y = -1).
        float along = smoothstep(-1.0, -0.05, vY) * (0.35 + 0.65 * smoothstep(-1.0, 0.0, vY));
        float haze = 0.55 + 0.45 * noise(vec3(vLocal.xz * 3.0, vY * 2.0 - uTime * 0.25));
        float gobo = 0.85 + 0.15 * sin(atan(vLocal.z, vLocal.x) * 6.0);
        float density = 0.25 + 0.5 * uHaze;
        gl_FragColor = vec4(uColor * vLevel * soft * along * haze * gobo * density, 1.0);
      }
    `,
  })
}
```

  In `Rig`'s frame loop set `mat.uniforms.uHaze.value = c.fog`.

- [ ] **Step 3: Flare texture** — `webgl/flare.ts`:

```ts
import * as THREE from 'three'

/** Lens glow: soft radial falloff plus a thin horizontal streak. Drawn once into a 128² canvas. */
export function createFlareTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')!
  const r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  r.addColorStop(0, 'rgba(255,255,255,1)')
  r.addColorStop(0.15, 'rgba(255,255,255,0.6)')
  r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r
  g.fillRect(0, 0, size, size)
  const s = g.createLinearGradient(0, 0, size, 0)
  s.addColorStop(0, 'rgba(255,255,255,0)')
  s.addColorStop(0.5, 'rgba(255,255,255,0.7)')
  s.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = s
  g.fillRect(0, size / 2 - 1, size, 2)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
```

- [ ] **Step 4: Lens = disc + flare sprite** — in `Rig`, replace the sphere lens mesh with:
  - a lens disc: `<circleGeometry args={[0.16, 32]} />` + `meshBasicMaterial toneMapped={false}` (same instance colour logic as now), placed at the fixture facing the beam direction (same matrix as the beam's rotation, offset 0.02 along the beam).
  - a flare: a second `InstancedMesh` of `PlaneGeometry(1.2, 1.2)` with `meshBasicMaterial map={flare} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false}`; each frame orient every instance to face the camera (`obj.quaternion.copy(state.camera.quaternion)`) and scale by `0.4 + level * 0.9`; colour via `setColorAt` = hue × level.
  - dispose the flare texture in the existing `useEffect` cleanup.

- [ ] **Step 5: Bloom retune** — `luminanceThreshold={0.55}`, base intensity `0.5` (pad flash adds `+ flash.value * 1.4` as now). The flare now carries the glow; bloom only adds bleed.

- [ ] **Step 6: Checks** — `pnpm test && pnpm typecheck && pnpm lint && pnpm build` → pass. The shader has no unit test; the controller checks it visually (desktop, phone, reduced motion) and with the CDP frame-time probe.

- [ ] **Step 7: Commit**

```bash
git add webgl
git commit -m "feat(webgl): soft volumetric beams, lens flares and haze-driven density"
```

---

### Task 4: Model pipeline and loader (blocked on PM Step 0)

**PM Step 0:** download the shortlisted Sketchfab models (glTF or GLB) into `assets-src/` — one folder per model. The controller picks the moving-head variant after previewing.

| Part | Model | Author | Licence | URL |
|---|---|---|---|---|
| Moving head | Moving Head Beam (high Poly) | lordhenry | CC BY 4.0 | https://sketchfab.com/3d-models/ce283a1277bb4e98bd29b157075e003f |
| Moving head (alt) | Low Poly Wash Moving Head | CN Entertainment | CC BY 4.0 | https://sketchfab.com/3d-models/0c87b5fe159f42be8af7c0f0a5b714dd |
| Truss segment | Square Truss Straight Segment 21 | akerStudio | CC BY 4.0 | https://sketchfab.com/3d-models/f43719b6267645a587a9d3959b5f2d2b |
| Line array box | Line Array | Wilmer.Jose.Saumeth.Suarez | CC BY 4.0 | https://sketchfab.com/3d-models/cc558455c6d141ccb69c23222af46c8a |
| Floor par | Stage Light | daniyalmalik | CC BY 4.0 | https://sketchfab.com/3d-models/d3e138ecee20439d939d27cbdba208d1 |

**Files:**
- Modify: `.gitignore` (add `/assets-src/`)
- Create: `public/models/moving-head.glb`, `truss.glb`, `line-array.glb`, `par.glb`
- Create: `webgl/assets.ts`, `webgl/assets.test.ts`
- Create: `scripts/optimize-models.sh` (records the exact commands; not run in CI)

**Interfaces:**
- `export type FixtureKind = 'movingHead' | 'truss' | 'lineArray' | 'par'`
- `export type FixtureMesh = { geometry: THREE.BufferGeometry; material: THREE.Material; role: 'base' | 'yoke' | 'head' }`
- `export type FixtureModel = { meshes: FixtureMesh[]; size: THREE.Vector3; pivot: THREE.Vector3 }` (size of the normalised model; `pivot` = head tilt axis for moving heads, else zero)
- `export function loadStageAssets(load?: (url: string) => Promise<GLTF>): Promise<Partial<Record<FixtureKind, FixtureModel>>>` — never rejects; a failed model is simply missing from the record.
- `export function useStageAssets(): Partial<Record<FixtureKind, FixtureModel>>` — starts loading on first mount, returns `{}` until loaded.

- [ ] **Step 1: Optimise** — for each model: `npx -y @gltf-transform/cli@4 optimize <in> public/models/<name>.glb --compress meshopt --texture-compress webp --texture-size 512 --simplify true --simplify-ratio <r>` with `r` chosen so each file is ≤ 250 KB and all ≤ 1 MB. Record the final commands in `scripts/optimize-models.sh`. Inspect with `npx -y @gltf-transform/cli@4 inspect` and note node names (yoke/head) for Step 3.

- [ ] **Step 2: Failing tests** — `webgl/assets.test.ts`:

```ts
import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { loadStageAssets } from './assets'

const gltfWith = (...meshes: THREE.Mesh[]) => {
  const scene = new THREE.Group()
  meshes.forEach((m) => scene.add(m))
  return { scene } as never
}

describe('loadStageAssets', () => {
  it('returns no model (not an error) when a file fails to load', async () => {
    const out = await loadStageAssets(() => Promise.reject(new Error('404')))
    expect(out).toEqual({})
  })

  it('flattens a model into world-baked meshes normalised to a 1 m height', async () => {
    const box = new THREE.Mesh(new THREE.BoxGeometry(2, 4, 2), new THREE.MeshStandardMaterial())
    box.position.set(5, 0, 0)
    const out = await loadStageAssets(() => Promise.resolve(gltfWith(box)))
    const model = out.par!
    expect(model.meshes.length).toBe(1)
    expect(model.size.y).toBeCloseTo(1)
    model.meshes[0].geometry.computeBoundingBox()
    const bb = model.meshes[0].geometry.boundingBox!
    expect(bb.min.y).toBeCloseTo(0) // sits on its base
    expect((bb.min.x + bb.max.x) / 2).toBeCloseTo(0) // centred on x/z
  })
})
```

- [ ] **Step 3: Implement `webgl/assets.ts`** — `GLTFLoader` with `setMeshoptDecoder(MeshoptDecoder)`; per model: `scene.updateMatrixWorld(true)`, traverse meshes, clone each geometry and `applyMatrix4(mesh.matrixWorld)`, compute the union box, translate so x/z are centred and min y = 0, scale uniformly to height 1, and assign `role` (moving head: meshes whose name or ancestor's name matches `/head|lamp|lens/i` → `head`, `/yoke|arm|fork/i` → `yoke`, else `base`; if no names match, split by bounding-box height: top 60% → head). `pivot` for the moving head is the centre of the yoke's upper box. Wrap each model in its own `try/catch` (`Promise.allSettled`). `useStageAssets` keeps a module-level promise so the four files are fetched once per page load.

- [ ] **Step 4: Run tests** — `pnpm test webgl/assets` → PASS.

- [ ] **Step 5: Commit**

```bash
git add .gitignore public/models scripts/optimize-models.sh webgl/assets.ts webgl/assets.test.ts
git commit -m "feat(webgl): load optimised stage models after the canvas mounts, with a procedural fallback"
```

---

### Task 5: Fixtures from models

**Files:**
- Create: `webgl/ModelInstances.tsx`
- Create: `stage/tiling.ts`, `stage/tiling.test.ts`
- Modify: `webgl/StageScene.tsx`

**Interfaces:**
- Consumes: `useStageAssets()`, `FixtureModel` (Task 4); `beamAim`, `showProgress` (Task 1); beam/flare (Task 3).
- `export function tileCount(length: number, segment: number): number` — whole segments covering `length` (≥ 1).
- `<ModelInstances model parts placement />` — one `InstancedMesh` per `FixtureMesh`, matrices updated each frame by the `placement(part, i, obj)` callback.

- [ ] **Step 1: Failing test** — `stage/tiling.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { tileCount } from './tiling'

describe('tileCount', () => {
  it('covers the length with whole segments, never fewer than one', () => {
    expect(tileCount(6, 2)).toBe(3)
    expect(tileCount(6.9, 2)).toBe(3)
    expect(tileCount(7.1, 2)).toBe(4)
    expect(tileCount(0.5, 2)).toBe(1)
  })
})
```

`stage/tiling.ts`: `export const tileCount = (length: number, segment: number) => Math.max(1, Math.round(length / segment))`.

- [ ] **Step 2: Truss** — each truss `Part` becomes `tileCount(longest side, 2)` segment instances laid end to end along its long axis (segment model scaled so its length is `part length / count` and its cross-section is `BEAM`). Instances share the part's `partOffset` so a whole tower still flies in as one.

- [ ] **Step 3: Speakers** — each speaker `Part` (a hang) is filled by stacked line-array boxes: `count = tileCount(part height, boxHeight)`, each box tilted progressively (`i * 2°`) like a real J-curve.

- [ ] **Step 4: Moving heads** — hung lights use the moving-head model: `base` + `yoke` meshes rotate by `aim.pan` about y, `head` meshes additionally by `aim.tilt` about the model's `pivot`. Beam, lens disc and flare attach at the head's front (`pivot` + head-forward offset). Deck-level lights use the par model with a short floor wash beam.

- [ ] **Step 5: Materials** — `RoomEnvironment` + `PMREMGenerator` once, `scene.environment = env` (dispose on unmount); keep model textures; truss `metalness ≥ 0.8`.

- [ ] **Step 6: Fallback** — while `useStageAssets()` lacks a kind, that kind renders with today's `Bodies`/sphere path. Verify by renaming `public/models/truss.glb` locally: boxes render, no console error.

- [ ] **Step 7: Checks and commit** — `pnpm test && pnpm typecheck && pnpm lint && pnpm build`, then

```bash
git add stage/tiling.ts stage/tiling.test.ts webgl
git commit -m "feat(webgl): moving heads, truss and line arrays from models"
```

---

### Task 6: Credits

**Files:**
- Create: `content/credits.ts`, `public/models/CREDITS.md`
- Modify: `components/Footer.tsx`, `README.md`

- [ ] **Step 1:** `content/credits.ts` exports `modelCredits: { title: string; author: string; url: string; licence: string; licenceUrl: string }[]` — one entry per shipped model (only the ones actually used).
- [ ] **Step 2:** Footer: a "3D models" line listing each as `title by author (licence, modified)` with links. Text only; same `label` style.
- [ ] **Step 3:** `public/models/CREDITS.md` and a README "Credits" section with the same list.
- [ ] **Step 4:** Footer test: renders every `modelCredits` title and licence link.
- [ ] **Step 5:** Commit `docs(credits): credit the third-party stage models`.

---

## Verification (controller)

- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` all exit 0.
- CDP (scratchpad scripts) on the production build:
  - Desktop 1440×900: sample the HUD phase at every 10% of the pin; the `SHOW` phase lasts ≥ 1.3 screens of scroll; the canvas is visible (frameloop running) while the Manifesto is on screen, and paused once Work covers it.
  - Phone 390×844, reduced motion, WebGL off: no errors; reduced motion shows the assembled, lit stage with no pin; WebGL off shows the SVG and requests no `.glb`.
  - Network: `.glb` requests start only after the canvas mounts.
  - `final-review/stuck.mjs` (event → event) and home → event → back: no errors, shutter lifts.
- Lighthouse desktop, GPU, quiet machine, 3 runs: 100 / 100 / 100 / 100, TBT ≤ 50 ms, CLS 0. Record the GLB sizes and the 3D chunk size in the PR.
- PM reviews the show in the browser before the `v0.1.0` tag.
