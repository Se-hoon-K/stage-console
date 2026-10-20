# [AGENCY] — Portfolio Demo Site Design Spec

Fictional festival & event production agency · Tactile brutalism · "Stage + Console"

---

## 1. Context

**Who**: Sehoon Ko, frontend-leaning full-stack developer, job hunting in **Australia** (creative agencies + product companies, full-stack roles).

**Problem**: All past professional work is under NDA, so there is no web portfolio to show.

**Solution**: Build one award-level **demo site** that itself is the proof: "I can design and build this". It is **not** a self-introduction site. CV/LinkedIn carry the bio; the site carries the evidence.

**Subject**: a fictional festival & event production agency ("we build the show"). Placeholder name `[AGENCY]`.

**Feeling**: *tactile brutalism*: precise, engineered, physical. Raw structure, but exact; controls you want to touch.

**Secondary evidence**: the repo is public. Spec/plan docs under `docs/` and a clean commit history show an AI-assisted workflow (light touch, no in-site AI features).

**Deadline**: linkable MVP in **2–3 weeks** (by ~2026-11-10).

**Language**: English, placeholder copy.

### Decisions made during brainstorming (and why)
| Decision | Why |
|---|---|
| Demo site, not self-intro | NDA; the site itself must be the portfolio piece |
| One complete site, not many demos | Depth over breadth; award juries reward a single strong concept |
| Event agency, not architecture | Brutalist web style fits event/culture fields; architecture winners are polished-luxury |
| Tactile over classic/neo brutalism | "Precisely engineered" reads as skill; "deliberately rough" can read as lack of skill to recruiters |
| Stage assembly + console (A+C) | Cinematic first impression (stage) + hands-on tactility (console) |
| Console in DOM, stage in WebGL | Accessibility + dev speed; 3D only where it earns its cost |
| Procedural geometry first, Blender later | No asset licensing, small bundle; data shape allows GLB swap |

### References
- **Belgrade Arbor** (Awwwards SOTD + Dev, 2026-10-17, Next.js + GSAP + Three.js): user's preferred reference. Benchmark for cinematic 3D quality on the same stack.
- **FlowFest 2025** (SOTD + Dev, 2025-07-29, Dennis Snellenberg), **OFFF Forum** (SOTD 2026-10-16): event-category bar.
- **Heller Designstudio** (SOTD + Dev 2019): rare brutalist SOTD.
- No award site found using console-style navigation → concept is original.
- Recent winners' weakest Dev Award score is **accessibility (6.6–7.2)** → our differentiator.

---

## 2. Goals & success criteria

| Audience | Time spent | Must get |
|---|---|---|
| Recruiter | 30 s | "This is high quality." Credits line with name + links visible without hunting |
| Engineer interviewer | 5–10 min | Clean repo, readable architecture, a11y/perf done right, README explains decisions |
| Agency creative director | 1–3 min | Distinct concept, motion craft, details that reward play |

**MVP done when**
- Deployed on Vercel at a shareable URL, linked from CV
- Home + 1 event detail page complete on desktop and mobile
- Lighthouse desktop: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
- Console fully operable by keyboard; reduced-motion and no-WebGL paths render correctly
- README in repo: concept, stack, architecture diagram, decisions, how to run

**Stretch**: submit to Awwwards after post-MVP polish.

---

## 3. Information architecture

```
/                     Home
/events/[slug]        Event detail (MVP: one fully built; others post-MVP)
/not-found            404 ("NO SIGNAL")
```
Global: header (logo, menu, SOUND ON toggle), console (fixed bottom), footer with credits.

Normal navigation always exists (header menu + footer links). The console is an *additional* way to move, never the only one.

---

## 4. Page-by-page spec

### 4.1 Preloader: "Sound check"
- Black screen, mono label `SOUND CHECK — CH 01…08`, eight channel LEDs light one by one as assets load, big counter `000 → 100`.
- Exit: counter collapses into the logo; LEDs slide down and *become* the console's channel strip (continuity).
- Real progress from font + WebGL readiness (drei `useProgress`); minimum 1.2 s, maximum ~3 s.
- Shown only on first visit per session (`sessionStorage`, wrapped in try/catch).
- Reduced motion: no counter animation, simple fade.

### 4.2 Home

**CUE 01: Hero / stage assembly**
- Pinned full-viewport WebGL scene. Huge condensed headline over it: "WE BUILD THE SHOW." (SplitText, chars rise in on load).
- Scroll 0 → ~150vh: stage parts fly in from exploded positions and snap together; camera slowly dollies in.
- End: lights switch on one by one (LED red flashes on the console in sync); haze/fog appears.
- Small mono HUD: `ASSEMBLY 064%`, part count `PARTS 38/52`.

**Console (fixed, appears after the preloader)**
- Spec in §5. On the home page it drives the hero stage's lighting.

**CUE 02: Manifesto**
- Short agency statement (3–4 lines). Scroll-scrubbed reveal: words go from outline to filled, like lights being raised.
- Display type width follows the master fader value (condensed ↔ expanded) when the user plays with it.

**CUE 03: Work (past events)**
- Index list of 4–5 fictional events, each row: number, name, city, year, type, capacity. 1px rules between rows.
- Hover/focus row: row "powers on" (LED dot lights, text expands in width), a small preview of that event's stage (its own seed) appears following the row.
- Click → event detail with page transition.

**CUE 04: Services**
- Grid of 4 services (Production, Stage & Light Design, Sound, Experience Design) styled like rack-mounted units: each a panel with screws, a label, a small toggle that expands details.
- Toggles are real `<button aria-expanded>`.

**CUE 05: Contact / footer**
- Huge email address as a marquee strip (pauses on hover/focus).
- "BOOK A SHOW" button with heavy press feel.
- Credits block (always visible in footer):
  > `[AGENCY]` is a fictional agency. This site is a portfolio piece designed & developed by **Sehoon Ko**. → GitHub · LinkedIn · Source code
- Local time in Melbourne/Sydney + "SHOW STATUS: LIVE" LED.

### 4.3 Event detail (`/events/[slug]`): one fully built
1. **Title block**: event name in giant condensed type, metadata strip (date, venue, city, capacity, duration) as mono "spec sheet".
2. **Stage**: the event's own generated stage (seed per event) assembling on scroll, same engine as home.
3. **Run sheet**: the show schedule as a cue list (`18:00 DOORS`, `19:30 ACT 1`…), the current cue highlights while scrolling.
4. **Numbers**: big stats (attendees, crew, lights, km of cable) counting up when in view.
5. **Gallery**: 4–6 images (AI-generated or CC0) with image transition on hover (RGB-split shader or simple clip reveal).
6. **Next event**: big link to the next event (loops).

### 4.4 404: "NO SIGNAL"
- Static noise canvas (cheap 2D), meters at zero, button "RETURN TO STAGE".

### 4.5 Page transitions
- Out: a "blackout" (lights fade down + horizontal shutter wipe in panel black, 0.6 s).
- In: shutter opens, new page's headline animates in.
- Implemented with a `TransitionLink` (plays out-animation → `router.push`) + `app/template.tsx` for the in-animation. No transition library.
- Persistent Canvas keeps running; the scene swaps under the blackout.

---

## 5. Console spec

### Layout (desktop, fixed bottom, ~96 px tall, expandable to ~220 px)
```
┌─────────────────────────────────────────────────────────────────────────┐
│ [SOUND ON]  CUE 01 02 03 04 05 │ MASTER ▮  HUE ▮  INT ▮ │ TEMPO ◯ FOG ◯ │ PAD PAD PAD PAD │ METER ▮▮ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Controls
| Control | Element | Range / steps | Effect |
|---|---|---|---|
| SOUND ON | `<button aria-pressed>` toggle | on/off | Creates AudioContext on first press; mutes/unmutes master gain |
| CUE 01–05 | `<button>` | — | `lenis.scrollTo(section)`; active cue LED follows scroll position |
| MASTER | `<input type=range>` vertical fader | 0–100 | Overall stage light level + display type width |
| HUE | fader | 0–360 | Stage light colour |
| INT | fader | 0–100 | Spotlight intensity / beam visibility |
| TEMPO | knob (`role="slider"`, arrow keys) | 60–180 BPM, 12 detents | Light chase speed, pad loop speed |
| FOG | knob | 0–100, 10 detents | Haze density in WebGL |
| PAD 1–4 | `<button>` | — | Synth sounds (kick, snare/noise hit, riser, drop) + light flash |
| METER | `<meter>`/visual | — | Real audio level (AnalyserNode); idle shimmer when sound off |

### Feel
- Knobs snap to detents with a tiny overshoot; drag vertically or use wheel; arrow keys step, Shift+arrow ×5.
- Faders: inertia on release (GSAP), thumb has inset groove shadow, value tooltip in mono.
- Buttons: 2 px press, LED on; click sound when sound on.
- `Reset` (double-click a control) returns to default.

### Accessibility
- Every control has a visible label and `aria-label` with unit (`"Fog, 40 percent"`).
- Tab order follows visual order; focus ring in LED red, 2 px.
- Console `role="region" aria-label="Show console"`; skip-link "Skip console".

### Mobile (< 768 px)
- Collapsed bar: SOUND ON + current cue + "OPEN CONSOLE".
- Opens as a bottom sheet with horizontal faders, larger knobs, 2×2 pads.

### State (`console/store.ts`)
```ts
type ConsoleState = {
  soundOn: boolean
  master: number    // 0..1
  hue: number       // 0..360
  intensity: number // 0..1
  tempo: number     // 60..180
  fog: number       // 0..1
  activeCue: number // 1..5
}
```
- Plain module with `get()`, `set(partial)`, `subscribe(fn)`. React reads via `useSyncExternalStore`; WebGL reads `get()` inside `useFrame` (no re-render).
- Not persisted (fresh show every visit).

---

## 6. Stage spec (WebGL)

### Data (`stage/generateStage.ts`)
```ts
type PartKind = 'deck' | 'truss' | 'light' | 'speaker' | 'screen'
type Part = {
  id: string
  kind: PartKind
  position: [number, number, number]   // assembled
  rotation: [number, number, number]
  size: [number, number, number]
  exploded: [number, number, number]   // offset from assembled
  order: number                        // assembly order 0..1
}
type Stage = { seed: number; parts: Part[]; bounds: [number, number, number] }
```

### Generation rules (seeded PRNG, e.g. mulberry32, ~10 lines)
- Deck: 1 main platform (width 8–14 m), optional thrust/runway.
- Truss: front + rear horizontal truss, 2–4 vertical towers; grid of square truss segments.
- Lights: 8–24 moving heads on truss at even spacing; 2–4 floor washes.
- Speakers: left/right line arrays (4–8 boxes each), optional subs under deck.
- Screen: optional LED wall behind (seed decides).
- Assembly order: deck → towers → horizontal truss → speakers → lights → screen.
- Exploded offset: direction away from stage center + upward, scaled by order.

### Rendering (`webgl/StageScene.tsx`)
- Instanced meshes per kind (truss segments are many → `InstancedMesh`).
- Materials: matte black metal (`MeshStandardMaterial`, roughness 0.6), deck in dark grey, speaker grilles with a simple procedural dot texture.
- Lighting: spotlights with volumetric-looking cones (additive cone mesh + noise shader, not real volumetrics), colour from `hue`, intensity from `master × intensity`.
- Fog: `scene.fog` density from `fog` + a cheap screen-space haze layer.
- Chase: lights pulse in sequence at `tempo`.
- Pads: flash = brief intensity spike + bloom (`@react-three/postprocessing` Bloom only, low-res).
- Camera: slow dolly during assembly; subtle mouse parallax afterwards.

### Assembly (`progress` 0..1 from ScrollTrigger scrub)
- Each part's local t = clamp((progress − order × 0.7) / 0.15) → eased with a "snap" curve (fast travel, tiny overshoot, settle).
- 0.8–1.0: lights switch on one by one.
- Reduced motion: progress fixed at 1.

### Fallback (`stage/toSvg.ts`)
- Same `Stage` data → SVG front elevation (rects for deck/truss/speakers, circles for lights). Light colour reflects `hue`.
- Used when WebGL unavailable (detect via `WebGLRenderingContext` creation) or on very low-power devices.

---

## 7. Audio spec (`console/audio.ts`)
- Created lazily on first SOUND ON (autoplay policy).
- Graph: sources → master `GainNode` → `AnalyserNode` → destination.
- Sounds synthesized (no assets):
  - Kick: sine 150→40 Hz pitch drop, 0.3 s
  - Hit: filtered white-noise burst, 0.15 s
  - Riser: noise + sawtooth with rising lowpass, 2 s
  - Drop: kick + sub sine, 0.8 s
  - UI click: 2 ms noise tick (very quiet)
- Idle ambience drone: post-MVP.
- Meter reads `getByteTimeDomainData` each frame.

---

## 8. Visual system

### Tokens (`app/globals.css`, Tailwind v4 `@theme`)
```
--color-stage:   #0E0E0E   page background
--color-panel:   #1A1A1A   console / rack panels
--color-line:    #2E2E2E   1px rules on dark
--color-ink:     #EDEBE6   text on dark
--color-mute:    #8A8780   secondary text
--color-paper:   #EDEBE6   inverted section background
--color-led:     #FF3B1F   accent = "lit"
```
- Contrast: ink on stage ≈ 16:1, mute on stage ≥ 4.5:1 (verify), LED red used for state, never as the only signal for meaning.

### Type
- Display: **Archivo** variable (wdth 62–125, wght 100–900). Hero ~clamp(4rem, 14vw, 16rem), tight leading 0.85, uppercase.
- Labels/data: **IBM Plex Mono** 11–13 px, uppercase, letter-spacing 0.06em.
- Body: Archivo regular 16–18 px.

### Grid & spacing
- 12-col grid, 1px visible column lines on dark sections (very low contrast).
- Spacing scale 4 px base. No border radius anywhere. No decorative shadows; only physical insets on console.

### Texture
- Film grain overlay (tiny tiled PNG or CSS SVG noise, opacity ~4%, `pointer-events:none`).
- LED glow: `box-shadow` in LED red only on lit elements.

### Motion tokens
- Ease "mechanical": `cubic-bezier(0.7, 0, 0.2, 1)`; ease "snap": custom GSAP ease with small overshoot.
- Durations: micro 120–200 ms, UI 300–600 ms, transitions 600–900 ms, scroll effects scrubbed.

---

## 9. Content model (`content/`)
```ts
// agency.ts
export const agency = {
  name: '[AGENCY]',
  tagline: 'We build the show.',
  manifesto: string[],
  services: { id, title, summary, details: string[] }[],
  email, city: 'Melbourne', socials,
  credits: { author: 'Sehoon Ko', github, linkedin, repo },
}

// events.ts
export type Event = {
  slug: string; name: string; city: string; venue: string
  date: string; type: 'Festival' | 'Concert' | 'Launch' | 'Conference'
  capacity: number; seed: number
  runSheet: { time: string; cue: string }[]
  stats: { label: string; value: number; unit?: string }[]
  images: { src: string; alt: string }[]
  featured: boolean   // true = full detail page in MVP
}
```
All copy is placeholder; PM supplies final names/copy later.

---

## 10. Architecture & folders

Stack: Next.js (App Router, TypeScript, static generation), Tailwind v4, GSAP (+ScrollTrigger, SplitText), Lenis, @react-three/fiber + drei (+ postprocessing Bloom), native Web Audio. Hosting: Vercel. Package manager: pnpm.

```
app/
  layout.tsx            fonts, SmoothScroll, persistent <Scene/>, <Console/>, header/footer
  template.tsx          page-in transition
  page.tsx              home sections
  events/[slug]/page.tsx  generateStaticParams from content/events
  not-found.tsx
components/
  SmoothScroll.tsx      Lenis ↔ GSAP ticker, exposes lenis instance
  TransitionLink.tsx
  Preloader.tsx
  Header.tsx, Footer.tsx (credits)
  sections/             Hero, Manifesto, Work, Services, Contact
  console/              Console, Fader, Knob, CueButton, Pad, Meter, SoundToggle
webgl/
  Scene.tsx             persistent Canvas (dynamic import, ssr:false), WebGL detection → fallback
  StageScene.tsx
  LightCone.tsx, shaders/
stage/
  generateStage.ts  prng.ts  toSvg.ts  generateStage.test.ts
console/
  store.ts  audio.ts
content/
  agency.ts  events.ts
public/images/events/
docs/superpowers/specs/2026-10-20-portfolio-design.md
README.md
```

Data flow:
```
content/events (seed) ─► generateStage ─► StageScene (WebGL)  or  toSvg (fallback)
ScrollTrigger ─► progress ─────────────────┘
Console (DOM) ─► store ─► StageScene (useFrame) + audio + Meter
```

---

## 11. Accessibility checklist
- Semantic landmarks (header/main/footer, sections with headings), real `<a>` links.
- `prefers-reduced-motion`: Lenis off, no scrub (static assembled stage), no marquee, no text splitting animations.
- Console keyboard-operable, labelled, visible focus; skip link.
- Sound never auto-plays; visual feedback never depends on sound.
- Canvas is `aria-hidden`; the stage has a text description for screen readers.
- Colour contrast AA minimum; LED red never sole carrier of meaning.

## 12. Performance budget
- First-load JS for home ≤ ~250 KB gzip excluding three.js chunk; three.js chunk lazy-loaded after first paint.
- LCP ≤ 2.0 s desktop (headline text is LCP, not canvas).
- 60 fps on M-series laptop, ≥ 45 fps on mid Android; dpr capped at 2 (1.5 on mobile).
- Pause rendering when tab hidden or hero offscreen (`frameloop="demand"` when idle).
- Images: `next/image`, AVIF/WebP.

## 13. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Procedural stage looks cheap | Week 2 checkpoint; fall back to Blender GLB for hero only (data shape already supports it) |
| Console confuses recruiters | Normal menu always present; console starts collapsed-but-visible with a one-line hint |
| 3 weeks too tight | Cut order: 404 polish → gallery shader → fog → bloom → second camera move |
| Mobile perf | Fewer parts, no bloom, SVG fallback threshold |
| Fictional agency mistaken for real | Credits line in footer + meta description states it's a portfolio piece |

---

## 14. Milestones (each ends deployable on Vercel)

**Week 1: Foundation + console**
1. `git init`, Next.js + Tailwind v4 + pnpm scaffold, tokens, fonts, README skeleton, Vercel deploy
2. SmoothScroll (Lenis + GSAP), header/footer with credits, section skeletons with cue anchors
3. Console store + Fader/Knob/CueButton/Pad/SoundToggle components (keyboard + pointer)
4. Audio engine + Meter
✅ Checkpoint: console fully playable on a blank page, keyboard-only works

**Week 2: Stage + home**
5. PRNG + `generateStage` + test, `toSvg` fallback rendered in hero
6. Persistent Canvas, StageScene with instancing, materials, light cones
7. Scroll-driven assembly + lights-on, console → lights/fog/tempo/pads wired
8. Manifesto, Work list (with hover previews), Services, Contact sections
✅ Checkpoint: PM review of the signature moment (stage + console) — go/no-go on procedural vs Blender

**Week 3: Detail + polish**
9. Event detail page (title, stage, run sheet, stats, gallery, next)
10. Page transitions, preloader, 404
11. Mobile console sheet, responsive pass
12. A11y + reduced-motion + no-WebGL pass, Lighthouse, README final
✅ Checkpoint: MVP live, link goes into CV

## 15. Working agreement
- Claude = developer, Sehoon = PM. PM reviews screenshots/live URL at each checkpoint.
- Spec + implementation plan live in `docs/superpowers/`.

## 16. Version control (visible as part of the portfolio)
- Repo: **`Se-hoon-K/stage-console`**, public, created with `gh repo create`.
- Commit identity (repo-local only, global config untouched):
  `user.name "Sehoon Ko"`, `user.email "133936213+Se-hoon-K@users.noreply.github.com"`.
- Branching: `main` is always deployable. One branch per milestone task: `feat/console-store`, `feat/stage-generator`, `fix/…`, `docs/…`, `chore/…`.
- Commits: Conventional Commits (`feat(console): add knob detents`), small and focused.
- Pull requests: one per branch. Template `.github/pull_request_template.md` with **What / Why / How to test / Screenshots**. Squash-merge into `main` after CI passes. PM can review/approve on GitHub.
- CI: `.github/workflows/ci.yml` on PR + push to main: `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build`.
- Deploy: Vercel GitHub integration → preview URL per PR, production on `main`. (PM connects Vercel to the repo once; requires their Vercel login.)
- Branch protection on `main`: require CI pass + PR (set via `gh api` after first CI run).
- Tracking: GitHub Issues per milestone task, grouped in Milestones `Week 1/2/3`; PRs close issues (`Closes #12`).
- Releases: tag `v0.1.0` at MVP launch with release notes.
- `.gitignore` (Next.js defaults + `.env*`, `.vercel`), MIT license, README badges (CI, deploy).

### Bootstrap sequence (first task)
1. `git init -b main`, set repo-local identity
2. Commit spec (`docs: add design spec`) on `main`
3. `gh repo create Se-hoon-K/stage-console --public --source . --push`
4. Branch `chore/scaffold`: Next.js + Tailwind + pnpm, lint/typecheck/test scripts, CI workflow, PR template → PR → CI green → merge
5. Create Milestones + Issues from the implementation plan

## 17. Open items for PM (not blocking start)
- Connect Vercel to the GitHub repo (one-time, needs PM's Vercel account)
- Agency name and logo direction
- 4–5 event names/cities (placeholders until then)
- Gallery images source (AI-generated vs CC0 stock)
- Personal links for credits (GitHub, LinkedIn)

---

## First steps after approval
1. Bootstrap per §16: `git init`, save this spec to `docs/superpowers/specs/2026-10-20-portfolio-design.md`, commit, create public repo, push
2. PM reviews the spec file on GitHub → invoke `superpowers:writing-plans` for the task-level implementation plan (committed via PR)

## Verification
- `pnpm test`: generateStage determinism + no part below floor
- `pnpm build` passes (types + lint)
- Lighthouse targets in §2
- Chrome (claude-in-chrome) at 1440px and 390px: preloader, assembly, console play, transition, event page
- DevTools: reduced-motion emulation, WebGL disabled (`--disable-webgl` or blocklist) → SVG fallback, keyboard-only walkthrough
