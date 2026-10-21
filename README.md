# stage-console

[![CI](https://github.com/Se-hoon-K/stage-console/actions/workflows/ci.yml/badge.svg)](https://github.com/Se-hoon-K/stage-console/actions/workflows/ci.yml)

A portfolio demo site for a **fictional** festival & event production agency, designed and developed by **Sehoon Ko**.
All of my professional work is under NDA, so this site is the portfolio piece.

**Tactile brutalism.** A concert stage generated from a seed assembles in WebGL as you scroll, and a lighting/sound console at the bottom of the screen actually drives it: faders recolour and dim the rig, knobs set tempo and haze, pads fire synthesized sounds and flash the lights.

## Highlights

- **Procedural stage** — `generateStage(seed)` returns plain data (deck, truss, line arrays, moving heads, LED wall). The same data renders as instanced WebGL and as an SVG elevation fallback.
- **Playable console** — native range inputs and ARIA sliders; keyboard, wheel and drag; synthesized Web Audio (no audio files).
- **One persistent canvas** — shared across routes; each page tells it which seed to show and how far to build.
- **Accessible by default** — reduced motion shows the finished stage without pinning or animation; no WebGL falls back to SVG; every control is keyboard-operable.

## Architecture

```
content/shows (seed) ─► generateStage ─► StageScene (WebGL, instanced)   or   StageSvg (fallback)
ScrollTrigger (useStageSection) ─► stageView.progress ─┘
Console (DOM controls) ─► console store ─► StageScene (read every frame) · Web Audio · CSS variables
TransitionLink ─► shutter ─► router.push ─► template (scroll reset, lift shutter)
```

## Stack

Next.js (App Router, TypeScript) · Tailwind CSS · GSAP (ScrollTrigger, SplitText) · Lenis · React Three Fiber + postprocessing · Web Audio API · Vitest + Testing Library · GitHub Actions · Vercel

## Decisions

| Decision | Why |
|---|---|
| Console in DOM, stage in WebGL | Accessibility and speed; 3D only where it earns its cost |
| Procedural geometry | No asset licensing, tiny payload, a different stage per show |
| One external store, read per frame | Faders move the rig without React re-renders |
| 3D chunk loaded lazily and only with WebGL | First-load JS stays within budget |

## Run locally

```bash
pnpm install
pnpm dev     # http://localhost:3000
pnpm test
pnpm build
```

## How it was built

Every change landed through a pull request with CI. The design spec and the task-level plans for each stage are in [`docs/superpowers`](docs/superpowers).

## Credits

Concept, design and development: **Sehoon Ko** · [GitHub](https://github.com/Se-hoon-K)
`[AGENCY]` and its shows are fictional.

## License

MIT
