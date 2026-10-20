# Stage 1 — Foundation + Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A deployed Next.js site with the design tokens, page skeleton (5 cue sections, header, credits footer), Lenis smooth scroll, and a fully playable, keyboard-operable show console (cues, faders, knobs, pads, synthesized sound, level meter).

**Architecture:** Next.js App Router renders static sections. A tiny module store (`console/store.ts`, read through React `useSyncExternalStore`) holds console values; DOM controls write to it, audio reads it, and (in Stage 2) WebGL will read it per frame. Lenis drives scrolling through the GSAP ticker; `lib/scroll.ts` exposes `scrollToCue()` with a native fallback. Audio is native Web Audio, created lazily on the first "Sound" press, all sounds synthesized.

**Tech Stack:** Next.js 16.4 (App Router, TypeScript), React 19, Tailwind CSS 4.3, GSAP 3.15 (ScrollTrigger), Lenis 1.3.27, Vitest 5 + jsdom + Testing Library, pnpm 10.15, GitHub Actions, Vercel.

**Spec:** `docs/superpowers/specs/portfolio-design.md` (§3, §5, §7, §8, §9, §11, §14 Stage 1, §16)

**Scope note:** The spec spans three subsystems. This plan covers **Stage 1 only** (spec §14 items 1–4). Stage 2 (stage/WebGL + home sections) and Stage 3 (detail page, transitions, polish) get their own plans after this checkpoint.

## Global Constraints

- Repo `Se-hoon-K/stage-console`, default branch `main`, always deployable.
- Every task: its own branch (`feat/…`, `chore/…`, `docs/…`), Conventional Commit messages, PR with the template, CI green, **squash-merge**, delete branch.
- Every commit message ends with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Every PR body ends with the line `🤖 Generated with [Claude Code](https://claude.com/claude-code)`.
- Commit identity is repo-local: `Sehoon Ko <133936213+Se-hoon-K@users.noreply.github.com>` (already set). Never change global git config.
- Package manager pnpm (`"packageManager": "pnpm@10.15.0"`); Node 22.
- Colours: `#0E0E0E` stage, `#1A1A1A` panel, `#2E2E2E` line, `#EDEBE6` ink/paper, `#8A8780` mute, `#FF3B1F` LED. LED red = "lit" only.
- Fonts: Archivo variable (with `wdth` axis) for display/body, IBM Plex Mono for labels.
- No border radius except physically round controls (knobs). No decorative shadows; only physical insets on console controls.
- Sound never auto-plays; it starts only from the user pressing "Sound".
- `prefers-reduced-motion: reduce` → no Lenis, instant scroll jumps, no idle meter shimmer, transitions ≈ 0.
- Agency name is the constant `agency.name = '[AGENCY]'` (PM will rename later). Credits always visible in the footer.
- Console values: master 0–1, hue 0–360, intensity 0–1, tempo 60–180 BPM (12 detents), fog 0–1 (10 detents), activeCue 1–5.

## Review Focus

1. Out-of-range or `NaN` console values (knob dragged far past its end, wheel spam, bad input) → value stays clamped inside its range, never `NaN`. Pinned in Task 4 (store clamp tests) and Task 5 (knob at max stays at max).
2. Pressing a pad or reading the meter before audio started, or in a browser with no `AudioContext` → silent no-op, no exception; the Sound button disables itself and says "No audio". Pinned in Task 6.
3. Holding Enter on a pad (keyboard auto-repeat) → exactly one hit per press. Pinned in Task 6.
4. A credits link that isn't filled in yet (LinkedIn) → that link is omitted, not rendered as a broken `href`. Pinned in Task 2.
5. A cue pressed when its section doesn't exist on the current page (e.g. future event page) → nothing happens, no exception. Pinned in Task 3.

## File Structure

```
.github/workflows/ci.yml               CI: lint, typecheck, test, build            (Task 1)
.github/pull_request_template.md       What / Why / How to test / Screenshots      (Task 1)
LICENSE, README.md                     MIT; project overview                        (Task 1)
vitest.config.ts, vitest.setup.ts      test runner + jsdom shims                    (Task 1)
app/globals.css                        tokens (@theme), base, grain, focus, a11y    (Task 2)
app/layout.tsx                         fonts, metadata, Header/Console/main/Footer  (Task 2, 3, 5)
app/page.tsx                           five cue sections                            (Task 2)
app/page.test.tsx                                                                   (Task 2)
content/cues.ts                        CUES list + cueLabel()                       (Task 2)
content/agency.ts                      agency copy + credits                        (Task 2)
components/Section.tsx                 cue section wrapper                          (Task 2)
components/Header.tsx                  logo, main nav, Sound toggle                 (Task 2, 6)
components/Footer.tsx                  credits                                      (Task 2)
components/Footer.test.tsx                                                          (Task 2)
lib/scroll.ts, lib/scroll.test.ts      Lenis handle + scrollToCue()                 (Task 3)
components/SmoothScroll.tsx            Lenis ↔ GSAP ticker                          (Task 3)
console/store.ts, store.test.ts        console state store                          (Task 4)
console/controls.ts, controls.test.ts  clamp / detent / drag math                   (Task 4)
console/useCueTracking.ts              active cue follows scroll                    (Task 5)
components/console/console.css         console styles                               (Task 5, 6)
components/console/Fader.tsx           native range fader                           (Task 5)
components/console/Knob.tsx            role=slider knob                             (Task 5)
components/console/CueButton.tsx                                                    (Task 5, 6)
components/console/Console.tsx         region + groups                              (Task 5, 6)
components/console/Console.test.tsx                                                 (Task 5)
console/audio.ts, audio.test.ts        Web Audio engine + synth                     (Task 6)
components/console/SoundToggle.tsx, Pad.tsx, Meter.tsx                              (Task 6)
components/console/audio-controls.test.tsx                                          (Task 6)
```

## Deferred (explicitly not in Stage 1)

- Fader release inertia, console expand-to-220px state, mobile console bottom sheet, header nav on non-home routes (`/#cue-n`): Stage 3 polish.
- If the scaffold installs TypeScript < 5.7, `Uint8Array<ArrayBuffer>` in Task 6 won't typecheck; use plain `Uint8Array` there.
- Pads flashing stage lights, store → WebGL wiring: Stage 2.
- Contact local time, marquee, Work list content: Stage 2 home sections.

---

## Task 0: Commit this plan

- [ ] **Step 1: Branch, commit, PR, merge**

```bash
git switch main && git pull --ff-only
git switch -c docs/stage1-plan
git add docs/superpowers/plans/stage1-foundation-console.md
git commit -m "docs: add stage 1 implementation plan

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin docs/stage1-plan
gh pr create --title "docs: add stage 1 implementation plan" --body "$(cat <<'EOF'
## What
Task-level implementation plan for Stage 1 (foundation + console).

## Why
Spec §14 Stage 1. Plans are kept in the repo as part of the visible workflow.

## How to test
Read `docs/superpowers/plans/stage1-foundation-console.md`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
gh pr merge --squash --delete-branch
git switch main && git pull --ff-only
```
Expected: PR merged (no CI exists yet, so no checks).

---

## Task 1: Scaffold, tooling, CI, repo hygiene

**Files:**
- Create: whole Next.js scaffold (`package.json`, `app/`, `tsconfig.json`, `eslint.config.mjs`, `postcss.config.mjs`, `next.config.ts`, `AGENTS.md`, …)
- Create: `vitest.config.ts`, `vitest.setup.ts`, `.github/workflows/ci.yml`, `.github/pull_request_template.md`, `LICENSE`, `README.md`
- Modify: `.gitignore` (replaced by the scaffold's)

**Interfaces:**
- Produces: scripts `pnpm dev | build | lint | typecheck | test`; path alias `@/*` → repo root; jsdom test env with `window.matchMedia` and `Element.prototype.scrollIntoView` stubbed (both `vi.fn`); CI job named `check`.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c chore/scaffold
```

- [ ] **Step 2: Generate the scaffold in the scratchpad (repo dir is not empty)**

```bash
SCRATCH=/private/tmp/claude-501/-Users-sehoonko-Documents-Design-Portfolio/d5ca3724-f4ee-4982-83da-55f96c8adff9/scratchpad
rm -rf "$SCRATCH/scaffold"
cd "$SCRATCH" && npx -y create-next-app@16.4.2 scaffold --ts --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-pnpm --empty --skip-install --disable-git --no-agent-feedback --yes
rsync -a "$SCRATCH/scaffold/" /Users/sehoonko/Documents/Design_Portfolio/
cd /Users/sehoonko/Documents/Design_Portfolio && ls
```
Expected: `app/ package.json tsconfig.json eslint.config.mjs postcss.config.mjs next.config.ts AGENTS.md docs/ …` in the repo root. The scaffold's `.gitignore` replaced ours; confirm it still contains `.env*`, `.vercel`, `next-env.d.ts`: `grep -E "^\.env|\.vercel|next-env" .gitignore`.

- [ ] **Step 3: Pin pnpm and add scripts**

Edit `package.json`: add `"packageManager": "pnpm@10.15.0"` at top level and make `scripts` exactly:

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run --passWithNoTests"
}
```

- [ ] **Step 4: Install deps and test tooling**

```bash
pnpm install
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': fileURLToPath(new URL('./', import.meta.url)) } },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
  },
})
```

- [ ] **Step 6: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => cleanup())

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Element.prototype.scrollIntoView = vi.fn()
```

- [ ] **Step 7: Create `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    name: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step 8: Create `.github/pull_request_template.md`**

```markdown
## What

## Why

## How to test

## Screenshots

Closes #
```

- [ ] **Step 9: Create `LICENSE`**

```text
MIT License

Copyright (c) 2026 Sehoon Ko

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 10: Replace `README.md`**

```markdown
# stage-console

[![CI](https://github.com/Se-hoon-K/stage-console/actions/workflows/ci.yml/badge.svg)](https://github.com/Se-hoon-K/stage-console/actions/workflows/ci.yml)

A portfolio demo site for a **fictional** festival & event production agency.
Tactile brutalism: a WebGL stage that assembles as you scroll, and a playable lighting/sound console you can actually operate.

Designed & developed by **Sehoon Ko**. All past professional work is under NDA, so this site is the portfolio piece.

## Stack
Next.js (App Router, TypeScript) · Tailwind CSS · GSAP · Lenis · React Three Fiber · Web Audio API · Vitest · Vercel

## Run locally
```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm test       # unit tests
pnpm build      # production build
```

## How it was built
Design spec and task-level plans live in [`docs/superpowers`](docs/superpowers). Every change lands through a pull request with CI.

## License
MIT
```

- [ ] **Step 11: Verify all checks locally**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
Expected: all pass; vitest prints "No test files found, exiting with code 0"; `next build` lists route `/`.

- [ ] **Step 12: Commit, push, PR, wait for CI, merge**

```bash
git add -A
git commit -m "chore: scaffold Next.js app with tests, CI and PR template

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin chore/scaffold
gh pr create --title "chore: scaffold Next.js app with tests, CI and PR template" --body "$(cat <<'EOF'
## What
Next.js 16 + Tailwind 4 scaffold (pnpm), Vitest + Testing Library, GitHub Actions CI (lint, typecheck, test, build), PR template, MIT license, README.

## Why
Spec §14 item 1 and §16 (visible version-control workflow).

## How to test
`pnpm install && pnpm lint && pnpm typecheck && pnpm test && pnpm build`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
gh pr checks --watch
gh pr merge --squash --delete-branch
git switch main && git pull --ff-only
```
Expected: `check` passes on the PR.

- [ ] **Step 13: Protect `main` (PR + green `check` required, no approvals so a solo dev can merge)**

```bash
gh api -X PUT repos/Se-hoon-K/stage-console/branches/main/protection --input - <<'EOF'
{
  "required_status_checks": { "strict": true, "contexts": ["check"] },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 0 },
  "restrictions": null
}
EOF
```
Expected: JSON response containing `"required_status_checks"`.

- [ ] **Step 14: Create milestones and Stage 1 issues**

```bash
R=repos/Se-hoon-K/stage-console
gh api $R/milestones -f title="Stage 1: Foundation + console" -f due_on="2026-10-27T23:59:59Z"
gh api $R/milestones -f title="Stage 2: Stage + home" -f due_on="2026-11-03T23:59:59Z"
gh api $R/milestones -f title="Stage 3: Detail + polish" -f due_on="2026-11-10T23:59:59Z"
M="Stage 1: Foundation + console"
gh issue create --milestone "$M" --title "Design tokens, fonts and page skeleton" --body "Plan Task 2: tokens, Archivo + Plex Mono, header, credits footer, five cue sections."
gh issue create --milestone "$M" --title "Smooth scroll and scrollToCue" --body "Plan Task 3: Lenis via GSAP ticker, reduced-motion fallback, scrollToCue()."
gh issue create --milestone "$M" --title "Console store and control math" --body "Plan Task 4: clamped store, detents, drag math."
gh issue create --milestone "$M" --title "Console controls" --body "Plan Task 5: faders, knobs, cue buttons, console region, active cue tracking."
gh issue create --milestone "$M" --title "Console audio" --body "Plan Task 6: Web Audio engine, synthesized pads, Sound toggle, level meter."
gh issue list --milestone "$M"
```
Expected: five open issues. Note their numbers; each later PR body uses `Closes #<n>`.

- [ ] **Step 15: Ask the PM to connect Vercel**

Tell the user: "Import `Se-hoon-K/stage-console` at https://vercel.com/new (framework auto-detected, no env vars). After that every PR gets a preview URL." Do not wait on this; continue with Task 2.

---

## Task 2: Design tokens, fonts, page skeleton

**Files:**
- Modify: `app/globals.css`, `app/layout.tsx`, `app/page.tsx`
- Create: `content/cues.ts`, `content/agency.ts`, `components/Section.tsx`, `components/Header.tsx`, `components/Footer.tsx`
- Test: `components/Footer.test.tsx`, `app/page.test.tsx`

**Interfaces:**
- Produces:
  - `CUES: readonly { n: 1|2|3|4|5; label: string; title: string }[]`, `type CueNumber = 1|2|3|4|5`, `cueLabel(n: number): string` → `"CUE 03"`
  - `agency: { name; tagline; manifesto: string[]; services: Service[]; email; city; credits: { author; github; repo; linkedin?: string } }`
  - Every section: `<section id="cue-{n}" data-cue="{n}" tabIndex={-1}>` with heading id `cue-{n}-title`
  - CSS: `--console-h` custom property (body bottom padding reserved for the console), class `.label` (mono caption), `.skip-link`

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/page-skeleton
```

- [ ] **Step 2: Write the failing tests**

`components/Footer.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { agency } from '@/content/agency'
import { Footer } from './Footer'

describe('Footer credits', () => {
  const original = { ...agency.credits }
  afterEach(() => Object.assign(agency.credits, original))

  it('states the agency is fictional and credits the author', () => {
    render(<Footer />)
    expect(screen.getByRole('contentinfo')).toHaveTextContent(/is a fictional agency/)
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Sehoon Ko')
    expect(screen.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/Se-hoon-K')
    expect(screen.getByRole('link', { name: 'Source code' })).toHaveAttribute('href', 'https://github.com/Se-hoon-K/stage-console')
  })

  it('omits links that are not filled in yet', () => {
    agency.credits.linkedin = undefined
    render(<Footer />)
    expect(screen.queryByRole('link', { name: 'LinkedIn' })).toBeNull()
  })

  it('renders LinkedIn once it is provided', () => {
    agency.credits.linkedin = 'https://www.linkedin.com/in/example'
    render(<Footer />)
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/example')
  })
})
```

`app/page.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import Home from './page'

it('renders five cue sections, one h1, each labelled by its heading', () => {
  const { container } = render(<Home />)
  const sections = container.querySelectorAll('section[data-cue]')
  expect(sections).toHaveLength(5)
  sections.forEach((section, i) => {
    expect(section.id).toBe(`cue-${i + 1}`)
    expect(section.getAttribute('tabindex')).toBe('-1')
    expect(section.getAttribute('aria-labelledby')).toBe(`cue-${i + 1}-title`)
  })
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('We build the show.')
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test`
Expected: FAIL, cannot resolve `@/content/agency` / `./Footer`, and Home has no `section[data-cue]`.

- [ ] **Step 4: Create `content/cues.ts`**

```ts
export const CUES = [
  { n: 1, label: 'Show', title: 'We build the show.' },
  { n: 2, label: 'Manifesto', title: 'Manifesto' },
  { n: 3, label: 'Work', title: 'Selected shows' },
  { n: 4, label: 'Services', title: 'Services' },
  { n: 5, label: 'Contact', title: 'Book a show' },
] as const

export type CueNumber = (typeof CUES)[number]['n']

export const cueLabel = (n: number) => `CUE ${String(n).padStart(2, '0')}`
```

- [ ] **Step 5: Create `content/agency.ts`**

```ts
export type Service = { id: string; title: string; summary: string; details: string[] }

export type Credits = { author: string; github: string; repo: string; linkedin?: string }

export const agency: {
  name: string
  tagline: string
  manifesto: string[]
  services: Service[]
  email: string
  city: string
  credits: Credits
} = {
  name: '[AGENCY]',
  tagline: 'We build the show.',
  manifesto: [
    'We are the people behind the lights.',
    'Every cable, cue and curfew, engineered.',
    'Rigged for thousands. Timed to the frame.',
    'When the house lights drop, it all just works.',
  ],
  services: [
    {
      id: 'production',
      title: 'Production',
      summary: 'End-to-end show delivery, from site plan to load-out.',
      details: ['Site and venue planning', 'Run sheets and show calling', 'Crew and vendor management'],
    },
    {
      id: 'stage-light',
      title: 'Stage & Light Design',
      summary: 'Structures and light rigs designed around the moment.',
      details: ['Stage and truss design', 'Lighting design and programming', 'Pre-visualisation'],
    },
    {
      id: 'sound',
      title: 'Sound',
      summary: 'Systems tuned for every seat in the house.',
      details: ['PA design and tuning', 'Monitor engineering', 'Noise compliance'],
    },
    {
      id: 'experience',
      title: 'Experience Design',
      summary: 'Everything the audience touches between the gates and the stage.',
      details: ['Wayfinding and signage', 'Interactive installations', 'Accessibility planning'],
    },
  ],
  email: 'hello@example.com',
  city: 'Melbourne',
  credits: {
    author: 'Sehoon Ko',
    github: 'https://github.com/Se-hoon-K',
    repo: 'https://github.com/Se-hoon-K/stage-console',
    linkedin: undefined,
  },
}
```

- [ ] **Step 6: Create `components/Section.tsx`**

```tsx
import type { ReactNode } from 'react'
import { CUES, cueLabel, type CueNumber } from '@/content/cues'

type Props = { cue: CueNumber; level?: 1 | 2; className?: string; children?: ReactNode }

export function Section({ cue, level = 2, className = '', children }: Props) {
  const { label, title } = CUES[cue - 1]
  const Heading = level === 1 ? 'h1' : 'h2'
  const headingClass =
    level === 1
      ? 'font-display text-[clamp(4rem,14vw,16rem)] font-black uppercase leading-[0.85] tracking-tight'
      : 'font-display text-[clamp(2.5rem,7vw,7rem)] font-extrabold uppercase leading-[0.9] tracking-tight'

  return (
    <section
      id={`cue-${cue}`}
      data-cue={cue}
      tabIndex={-1}
      aria-labelledby={`cue-${cue}-title`}
      className={`${cue === 1 ? '' : 'border-t border-line'} px-5 py-24 md:px-10 ${className}`}
    >
      <p className="label mb-6">
        {cueLabel(cue)} — {label}
      </p>
      <Heading id={`cue-${cue}-title`} className={headingClass}>
        {title}
      </Heading>
      {children}
    </section>
  )
}
```

- [ ] **Step 7: Create `components/Footer.tsx`**

```tsx
import { agency } from '@/content/agency'

export function Footer() {
  const { name, credits } = agency
  return (
    <footer className="label border-t border-line px-5 py-10 md:px-10">
      <p className="max-w-3xl normal-case tracking-normal">
        <span className="text-ink">{name}</span> is a fictional agency. This site is a portfolio piece designed &amp;
        developed by <span className="text-ink">{credits.author}</span>.
      </p>
      <ul className="mt-4 flex flex-wrap gap-6">
        <li>
          <a href={credits.github} className="hover:text-ink">GitHub</a>
        </li>
        {credits.linkedin && (
          <li>
            <a href={credits.linkedin} className="hover:text-ink">LinkedIn</a>
          </li>
        )}
        <li>
          <a href={credits.repo} className="hover:text-ink">Source code</a>
        </li>
      </ul>
    </footer>
  )
}
```

- [ ] **Step 8: Create `components/Header.tsx`**

```tsx
import Link from 'next/link'
import { agency } from '@/content/agency'
import { CUES } from '@/content/cues'

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-6 border-b border-line bg-stage/90 px-5 py-3 backdrop-blur md:px-10">
      <Link href="/" className="font-display text-lg font-black uppercase tracking-tight">
        {agency.name}
      </Link>
      <nav aria-label="Main" className="overflow-x-auto">
        <ul className="label flex gap-4">
          {CUES.map((c) => (
            <li key={c.n}>
              <a href={`#cue-${c.n}`} className="hover:text-ink">
                {c.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
```

- [ ] **Step 9: Replace `app/page.tsx`**

```tsx
import { Section } from '@/components/Section'
import { agency } from '@/content/agency'

export default function Home() {
  return (
    <>
      <Section cue={1} level={1} className="flex min-h-[calc(100svh-var(--console-h))] flex-col justify-end" />

      <Section cue={2}>
        <div className="mt-12 max-w-4xl space-y-2 text-[clamp(1.5rem,3vw,2.75rem)] font-semibold leading-tight">
          {agency.manifesto.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </Section>

      <Section cue={3} />

      <Section cue={4}>
        <ul className="mt-12 grid gap-px bg-line md:grid-cols-2">
          {agency.services.map((s) => (
            <li key={s.id} className="bg-stage p-6">
              <h3 className="text-2xl font-bold uppercase">{s.title}</h3>
              <p className="mt-2 text-mute">{s.summary}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section cue={5}>
        <a href={`mailto:${agency.email}`} className="mt-12 block text-[clamp(1.5rem,5vw,4rem)] font-bold hover:text-led">
          {agency.email}
        </a>
      </Section>
    </>
  )
}
```

- [ ] **Step 10: Replace `app/globals.css`**

```css
@import 'tailwindcss';

@theme {
  --color-stage: #0e0e0e;
  --color-panel: #1a1a1a;
  --color-line: #2e2e2e;
  --color-ink: #edebe6;
  --color-mute: #8a8780;
  --color-paper: #edebe6;
  --color-led: #ff3b1f;

  --font-display: var(--font-archivo), system-ui, sans-serif;
  --font-mono: var(--font-plex-mono), ui-monospace, monospace;

  --ease-mechanical: cubic-bezier(0.7, 0, 0.2, 1);

  --radius-*: initial;
}

:root {
  --console-h: 104px;
}

html {
  background: var(--color-stage);
  color: var(--color-ink);
}

body {
  min-height: 100dvh;
  padding-bottom: var(--console-h);
  font-family: var(--font-display);
}

/* Film grain */
body::after {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 100;
  pointer-events: none;
  opacity: 0.05;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

:focus-visible {
  outline: 2px solid var(--color-led);
  outline-offset: 2px;
}

/* Sections receive programmatic focus after a cue jump; the jump itself is the feedback. */
[data-cue]:focus {
  outline: none;
}

.label {
  font-family: var(--font-mono);
  font-size: 12px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-mute);
}

.skip-link {
  position: absolute;
  top: -48px;
  left: 8px;
  z-index: 200;
  padding: 8px 12px;
  background: var(--color-led);
  color: var(--color-stage);
  font-family: var(--font-mono);
  font-size: 12px;
  text-transform: uppercase;
}

.skip-link:focus {
  top: 8px;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 11: Replace `app/layout.tsx`**

```tsx
import type { Metadata } from 'next'
import { Archivo, IBM_Plex_Mono } from 'next/font/google'
import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { agency } from '@/content/agency'
import './globals.css'

const archivo = Archivo({ subsets: ['latin'], axes: ['wdth'], variable: '--font-archivo', display: 'swap' })
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono', display: 'swap' })

export const metadata: Metadata = {
  title: `${agency.name} — Event production (portfolio piece)`,
  description: `${agency.name} is a fictional event production agency. A portfolio piece designed and developed by ${agency.credits.author}.`,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable}`}>
      <body>
        <a href="#main" className="skip-link">Skip to content</a>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
```

- [ ] **Step 12: Run tests and all checks**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm build`
Expected: 4 tests PASS; build succeeds.

- [ ] **Step 13: Visual check**

Run `pnpm dev` (background), open http://localhost:3000 in Chrome at 1440px and 390px. Expected: black page, grain visible on close look, giant "WE BUILD THE SHOW." at the bottom of the first screen, mono cue labels, footer credits. Tab once → red "Skip to content" appears. Take a screenshot for the PR.

- [ ] **Step 14: Commit, PR, merge**

```bash
git add -A
git commit -m "feat: add design tokens, fonts and page skeleton

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin feat/page-skeleton
gh pr create --title "feat: add design tokens, fonts and page skeleton" --body "$(cat <<'EOF'
## What
Colour/type/motion tokens, Archivo + IBM Plex Mono, header with cue nav, five cue sections, credits footer, skip link, reduced-motion base rule.

## Why
Spec §8 (visual system), §3 (IA), §4.2 credits, §11 (a11y).

## How to test
`pnpm test` · `pnpm dev` → Tab once for the skip link; footer shows credits.

## Screenshots
(attach desktop + 390px)

Closes #<issue for "Design tokens, fonts and page skeleton">

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
gh pr checks --watch
gh pr merge --squash --delete-branch
git switch main && git pull --ff-only
```

---

## Task 3: Smooth scroll and `scrollToCue`

**Files:**
- Create: `lib/scroll.ts`, `components/SmoothScroll.tsx`
- Modify: `app/layout.tsx`
- Test: `lib/scroll.test.ts`

**Interfaces:**
- Consumes: sections `#cue-{n}` with `tabIndex={-1}` (Task 2)
- Produces: `setLenis(l: Lenis | null): void`, `scrollToCue(n: number): boolean` (false when the section is absent); `<SmoothScroll />` (renders nothing, starts Lenis unless reduced motion).

- [ ] **Step 1: Branch and install**

```bash
git switch main && git pull --ff-only && git switch -c feat/smooth-scroll
pnpm add gsap lenis
```

- [ ] **Step 2: Write the failing test `lib/scroll.test.ts`**

```ts
import type Lenis from 'lenis'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { scrollToCue, setLenis } from './scroll'

describe('scrollToCue', () => {
  beforeEach(() => {
    document.body.innerHTML = '<section id="cue-3" tabindex="-1"></section>'
    vi.mocked(Element.prototype.scrollIntoView).mockClear()
  })
  afterEach(() => setLenis(null))

  it('returns false and does nothing when the section is not on this page', () => {
    expect(scrollToCue(9)).toBe(false)
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })

  it('falls back to smooth native scrolling and moves focus to the section', () => {
    const el = document.getElementById('cue-3')!
    expect(scrollToCue(3)).toBe(true)
    expect(el.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'smooth' })
    expect(document.activeElement).toBe(el)
  })

  it('jumps instantly when reduced motion is preferred', () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({ matches: true } as MediaQueryList)
    scrollToCue(3)
    expect(Element.prototype.scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'auto' })
  })

  it('delegates to Lenis when it is running', () => {
    const scrollTo = vi.fn()
    setLenis({ scrollTo } as unknown as Lenis)
    scrollToCue(3)
    expect(scrollTo).toHaveBeenCalledWith(document.getElementById('cue-3'), { duration: 1.2 })
    expect(Element.prototype.scrollIntoView).not.toHaveBeenCalled()
  })
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm test lib/scroll.test.ts`
Expected: FAIL, cannot resolve `./scroll`.

- [ ] **Step 4: Create `lib/scroll.ts`**

```ts
import type Lenis from 'lenis'

let lenis: Lenis | null = null

export function setLenis(instance: Lenis | null) {
  lenis = instance
}

export function scrollToCue(n: number): boolean {
  const el = document.getElementById(`cue-${n}`)
  if (!el) return false

  if (lenis) {
    lenis.scrollTo(el, { duration: 1.2 })
  } else {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' })
  }
  el.focus({ preventScroll: true })
  return true
}
```

- [ ] **Step 5: Run to verify it passes**

Run: `pnpm test lib/scroll.test.ts`
Expected: 4 PASS.

- [ ] **Step 6: Create `components/SmoothScroll.tsx`**

```tsx
'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'
import { useEffect } from 'react'
import { setLenis } from '@/lib/scroll'

export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.registerPlugin(ScrollTrigger)
    const lenis = new Lenis({ anchors: true, autoRaf: false })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    setLenis(lenis)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      setLenis(null)
    }
  }, [])

  return null
}
```

- [ ] **Step 7: Mount it in `app/layout.tsx`**

Add the import `import { SmoothScroll } from '@/components/SmoothScroll'` and render `<SmoothScroll />` as the first child of `<body>`:

```tsx
      <body>
        <SmoothScroll />
        <a href="#main" className="skip-link">Skip to content</a>
```

- [ ] **Step 8: Checks + manual verify**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm build`
Expected: all pass.
Manual (`pnpm dev`): wheel scrolling is smooth with inertia; header links glide to sections. In DevTools → Rendering → "Emulate prefers-reduced-motion: reduce", reload: scrolling is native and header links jump instantly.

- [ ] **Step 9: Commit, PR, merge**

```bash
git add -A
git commit -m "feat: add Lenis smooth scroll and scrollToCue helper

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin feat/smooth-scroll
gh pr create --title "feat: add Lenis smooth scroll and scrollToCue helper" --body "$(cat <<'EOF'
## What
Lenis driven by the GSAP ticker (ScrollTrigger-ready), disabled under reduced motion. `scrollToCue(n)` scrolls via Lenis or native fallback and moves focus to the section.

## Why
Spec §10 SmoothScroll, §5 cue buttons, §11 reduced motion.

## How to test
`pnpm test lib/scroll.test.ts` · `pnpm dev` with and without reduced-motion emulation.

Closes #<issue for "Smooth scroll and scrollToCue">

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
gh pr checks --watch
gh pr merge --squash --delete-branch
git switch main && git pull --ff-only
```

---

## Task 4: Console store and control math

**Files:**
- Create: `console/store.ts`, `console/controls.ts`
- Test: `console/store.test.ts`, `console/controls.test.ts`

**Interfaces:**
- Produces:
  - `type ConsoleState = { soundOn: boolean; master: number; hue: number; intensity: number; tempo: number; fog: number; activeCue: number }`
  - `DEFAULTS: ConsoleState` = `{ soundOn: false, master: 0.8, hue: 8, intensity: 0.7, tempo: 120, fog: 0.3, activeCue: 1 }`
  - `RANGES: Record<NumericKey, readonly [min, max]>`, `type NumericKey = 'master'|'hue'|'intensity'|'tempo'|'fog'|'activeCue'`
  - `consoleStore.get(): ConsoleState`, `.set(partial: Partial<ConsoleState>): void` (clamps numeric keys, ignores NaN, notifies only on change), `.setValue(key: NumericKey, v: number): void`, `.subscribe(fn: () => void): () => void`, `.reset(): void`
  - `useConsole<T>(selector: (s: ConsoleState) => T): T` (selector must return a primitive)
  - `clamp(v, min, max)`, `snapToDetent(v, min, max, detents)`, `stepValue(v, min, max, detents, dir: 1 | -1, multiplier = 1)`, `dragToValue(startValue, dy, min, max, pxForFullRange = 200)` — all return numbers rounded to 6 decimals.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/console-store
```

- [ ] **Step 2: Write the failing tests**

`console/store.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEFAULTS, consoleStore } from './store'

describe('consoleStore', () => {
  beforeEach(() => consoleStore.reset())

  it('starts from the defaults with sound off', () => {
    expect(consoleStore.get()).toEqual(DEFAULTS)
    expect(consoleStore.get().soundOn).toBe(false)
  })

  it('updates values and notifies subscribers once per change', () => {
    const fn = vi.fn()
    consoleStore.subscribe(fn)
    consoleStore.set({ master: 0.5, hue: 200 })
    expect(consoleStore.get().master).toBe(0.5)
    expect(consoleStore.get().hue).toBe(200)
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('does not notify when nothing changed', () => {
    const fn = vi.fn()
    consoleStore.subscribe(fn)
    consoleStore.set({ tempo: DEFAULTS.tempo })
    expect(fn).not.toHaveBeenCalled()
  })

  it('clamps numbers into their range', () => {
    consoleStore.set({ master: 2, tempo: 10, hue: -5, activeCue: 9 })
    expect(consoleStore.get()).toMatchObject({ master: 1, tempo: 60, hue: 0, activeCue: 5 })
  })

  it('ignores NaN and keeps the previous value', () => {
    consoleStore.set({ fog: Number.NaN })
    expect(consoleStore.get().fog).toBe(DEFAULTS.fog)
  })

  it('setValue writes a single numeric key', () => {
    consoleStore.setValue('intensity', 0.25)
    expect(consoleStore.get().intensity).toBe(0.25)
  })

  it('stops notifying after unsubscribe', () => {
    const fn = vi.fn()
    const off = consoleStore.subscribe(fn)
    off()
    consoleStore.set({ master: 0.1 })
    expect(fn).not.toHaveBeenCalled()
  })
})
```

`console/controls.test.ts`:
```ts
import { describe, expect, it } from 'vitest'
import { clamp, dragToValue, snapToDetent, stepValue } from './controls'

describe('control math', () => {
  it('clamps', () => {
    expect(clamp(5, 0, 1)).toBe(1)
    expect(clamp(-1, 0, 1)).toBe(0)
  })

  it('snaps to the nearest detent without float noise', () => {
    expect(snapToDetent(127, 60, 180, 12)).toBe(130)
    expect(snapToDetent(0.34, 0, 1, 10)).toBe(0.3)
    expect(snapToDetent(999, 60, 180, 12)).toBe(180)
  })

  it('steps by one detent, or five with a multiplier', () => {
    expect(stepValue(120, 60, 180, 12, 1)).toBe(130)
    expect(stepValue(120, 60, 180, 12, 1, 5)).toBe(170)
    expect(stepValue(0.3, 0, 1, 10, -1)).toBe(0.2)
  })

  it('never steps past the ends', () => {
    expect(stepValue(180, 60, 180, 12, 1)).toBe(180)
    expect(stepValue(60, 60, 180, 12, -1, 5)).toBe(60)
  })

  it('maps vertical drag to value (up = more) and clamps', () => {
    expect(dragToValue(0.5, -100, 0, 1)).toBe(1)
    expect(dragToValue(0.5, 50, 0, 1)).toBe(0.25)
    expect(dragToValue(0.5, -10_000, 0, 1)).toBe(1)
  })
})
```

- [ ] **Step 3: Run to verify they fail**

Run: `pnpm test console/`
Expected: FAIL, cannot resolve `./store` and `./controls`.

- [ ] **Step 4: Create `console/controls.ts`**

```ts
const round = (v: number) => Math.round(v * 1e6) / 1e6

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

export function snapToDetent(v: number, min: number, max: number, detents: number) {
  const step = (max - min) / detents
  return round(clamp(min + Math.round((v - min) / step) * step, min, max))
}

export function stepValue(v: number, min: number, max: number, detents: number, dir: 1 | -1, multiplier = 1) {
  const step = (max - min) / detents
  return snapToDetent(v + dir * step * multiplier, min, max, detents)
}

export function dragToValue(startValue: number, dy: number, min: number, max: number, pxForFullRange = 200) {
  return round(clamp(startValue - (dy / pxForFullRange) * (max - min), min, max))
}
```

- [ ] **Step 5: Create `console/store.ts`**

```ts
import { useSyncExternalStore } from 'react'
import { clamp } from './controls'

export type ConsoleState = {
  soundOn: boolean
  master: number
  hue: number
  intensity: number
  tempo: number
  fog: number
  activeCue: number
}

export const RANGES = {
  master: [0, 1],
  hue: [0, 360],
  intensity: [0, 1],
  tempo: [60, 180],
  fog: [0, 1],
  activeCue: [1, 5],
} as const

export type NumericKey = keyof typeof RANGES

export const DEFAULTS: ConsoleState = {
  soundOn: false,
  master: 0.8,
  hue: 8,
  intensity: 0.7,
  tempo: 120,
  fog: 0.3,
  activeCue: 1,
}

let state: ConsoleState = { ...DEFAULTS }
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())

export const consoleStore = {
  get: () => state,

  set(partial: Partial<ConsoleState>) {
    const next: ConsoleState = { ...state }
    let changed = false
    for (const key of Object.keys(partial) as (keyof ConsoleState)[]) {
      let value = partial[key]
      if (key in RANGES) {
        if (typeof value !== 'number' || Number.isNaN(value)) continue
        const [min, max] = RANGES[key as NumericKey]
        value = clamp(value, min, max)
      }
      if (value !== undefined && next[key] !== value) {
        ;(next as Record<keyof ConsoleState, unknown>)[key] = value
        changed = true
      }
    }
    if (!changed) return
    state = next
    notify()
  },

  setValue(key: NumericKey, value: number) {
    consoleStore.set({ [key]: value } as Partial<ConsoleState>)
  },

  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },

  reset() {
    state = { ...DEFAULTS }
    notify()
  },
}

export function useConsole<T>(selector: (s: ConsoleState) => T): T {
  return useSyncExternalStore(
    consoleStore.subscribe,
    () => selector(consoleStore.get()),
    () => selector(DEFAULTS),
  )
}
```

- [ ] **Step 6: Run to verify they pass**

Run: `pnpm test console/`
Expected: 12 PASS.

- [ ] **Step 7: Checks, commit, PR, merge**

```bash
pnpm lint && pnpm typecheck
git add -A
git commit -m "feat(console): add clamped console store and control math

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin feat/console-store
gh pr create --title "feat(console): add clamped console store and control math" --body "$(cat <<'EOF'
## What
Module store for console values (React via useSyncExternalStore, WebGL can read `get()` per frame without re-renders). Numeric values are clamped and NaN-safe in one place. Pure detent/step/drag math.

## Why
Spec §5 State. Clamping in the store means no control can push an out-of-range value downstream.

## How to test
`pnpm test console/`

Closes #<issue for "Console store and control math">

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
gh pr checks --watch
gh pr merge --squash --delete-branch
git switch main && git pull --ff-only
```

---

## Task 5: Console controls (faders, knobs, cues)

**Files:**
- Create: `components/console/console.css`, `components/console/Fader.tsx`, `components/console/Knob.tsx`, `components/console/CueButton.tsx`, `components/console/Console.tsx`, `console/useCueTracking.ts`
- Modify: `app/layout.tsx`
- Test: `components/console/Console.test.tsx`

**Interfaces:**
- Consumes: `consoleStore`, `useConsole`, `RANGES`, `DEFAULTS`, `type NumericKey` (Task 4); `snapToDetent`, `stepValue`, `dragToValue` (Task 4); `scrollToCue` (Task 3); `CUES`, `cueLabel` (Task 2).
- Produces: `<Console />` (contains a skip link to `#main` and `<section aria-label="Show console" data-lenis-prevent>`); `<Fader id label step format />`, `<Knob id label detents format />`, `<CueButton cue label />`; `useCueTracking()`; formatters `pct`, `deg`, `bpm` exported from `Console.tsx`.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/console-controls
```

- [ ] **Step 2: Write the failing test `components/console/Console.test.tsx`**

```tsx
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consoleStore } from '@/console/store'
import { scrollToCue } from '@/lib/scroll'
import { Console } from './Console'

vi.mock('@/lib/scroll', () => ({ scrollToCue: vi.fn(() => true) }))
vi.mock('next/navigation', () => ({ usePathname: () => '/' }))

describe('Console', () => {
  beforeEach(() => {
    consoleStore.reset()
    vi.mocked(scrollToCue).mockClear()
  })

  it('is a labelled region with five cues and five sliders', () => {
    render(<Console />)
    const region = screen.getByRole('region', { name: 'Show console' })
    expect(within(region).getAllByRole('button', { name: /^CUE/ })).toHaveLength(5)
    expect(within(region).getAllByRole('slider')).toHaveLength(5)
  })

  it('fader writes to the store and announces a unit', () => {
    render(<Console />)
    const master = screen.getByRole('slider', { name: 'Master' })
    fireEvent.change(master, { target: { value: '0.5' } })
    expect(consoleStore.get().master).toBe(0.5)
    expect(master).toHaveAttribute('aria-valuetext', '50%')
  })

  it('knob steps by detents from the keyboard and stops at its ends', () => {
    render(<Console />)
    const tempo = screen.getByRole('slider', { name: 'Tempo' })
    fireEvent.keyDown(tempo, { key: 'ArrowUp' })
    expect(tempo).toHaveAttribute('aria-valuenow', '130')
    fireEvent.keyDown(tempo, { key: 'ArrowUp', shiftKey: true })
    expect(tempo).toHaveAttribute('aria-valuenow', '180')
    fireEvent.keyDown(tempo, { key: 'ArrowUp' })
    expect(tempo).toHaveAttribute('aria-valuenow', '180')
    fireEvent.keyDown(tempo, { key: 'Home' })
    expect(tempo).toHaveAttribute('aria-valuenow', '60')
    expect(tempo).toHaveAttribute('aria-valuetext', '60 BPM')
  })

  it('double-click resets a knob to its default', () => {
    render(<Console />)
    const fog = screen.getByRole('slider', { name: 'Fog' })
    fireEvent.keyDown(fog, { key: 'End' })
    fireEvent.doubleClick(fog)
    expect(consoleStore.get().fog).toBe(0.3)
  })

  it('marks the active cue and jumps on click', () => {
    render(<Console />)
    act(() => consoleStore.setValue('activeCue', 3))
    expect(screen.getByRole('button', { name: /CUE 03/ })).toHaveAttribute('aria-current', 'true')
    fireEvent.click(screen.getByRole('button', { name: /CUE 05/ }))
    expect(scrollToCue).toHaveBeenCalledWith(5)
    expect(consoleStore.get().activeCue).toBe(5)
  })
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm test components/console`
Expected: FAIL, cannot resolve `./Console`.

- [ ] **Step 4: Create `components/console/Fader.tsx`**

```tsx
'use client'

import { useId } from 'react'
import { DEFAULTS, RANGES, consoleStore, useConsole } from '@/console/store'

type Props = {
  id: 'master' | 'hue' | 'intensity'
  label: string
  step: number
  format: (v: number) => string
}

export function Fader({ id, label, step, format }: Props) {
  const inputId = useId()
  const [min, max] = RANGES[id]
  const value = useConsole((s) => s[id])

  return (
    <div className="fader">
      <label htmlFor={inputId} className="console-label">
        {label}
      </label>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(e) => consoleStore.setValue(id, Number(e.currentTarget.value))}
        onDoubleClick={() => consoleStore.setValue(id, DEFAULTS[id])}
      />
      <span className="console-value" aria-hidden="true">
        {format(value)}
      </span>
    </div>
  )
}
```

- [ ] **Step 5: Create `components/console/Knob.tsx`**

```tsx
'use client'

import { type CSSProperties, type KeyboardEvent, useEffect, useRef } from 'react'
import { dragToValue, snapToDetent, stepValue } from '@/console/controls'
import { DEFAULTS, RANGES, consoleStore, useConsole } from '@/console/store'

type Props = {
  id: 'tempo' | 'fog'
  label: string
  detents: number
  format: (v: number) => string
}

export function Knob({ id, label, detents, format }: Props) {
  const [min, max] = RANGES[id]
  const value = useConsole((s) => s[id])
  const dialRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y: number; v: number } | null>(null)

  // Wheel needs a non-passive listener so it can stop the page from scrolling.
  useEffect(() => {
    const el = dialRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const current = consoleStore.get()[id]
      consoleStore.setValue(id, stepValue(current, min, max, detents, e.deltaY < 0 ? 1 : -1))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [id, min, max, detents])

  const onKeyDown = (e: KeyboardEvent) => {
    const mult = e.shiftKey ? 5 : 1
    let next: number | null = null
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = stepValue(value, min, max, detents, 1, mult)
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = stepValue(value, min, max, detents, -1, mult)
    else if (e.key === 'Home') next = min
    else if (e.key === 'End') next = max
    if (next === null) return
    e.preventDefault()
    consoleStore.setValue(id, next)
  }

  const angle = -135 + 270 * ((value - min) / (max - min))

  return (
    <div className="knob">
      <div
        ref={dialRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={format(value)}
        className="knob-dial"
        style={{ '--angle': `${angle}deg` } as CSSProperties}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { y: e.clientY, v: value }
        }}
        onPointerMove={(e) => {
          if (!drag.current) return
          const raw = dragToValue(drag.current.v, e.clientY - drag.current.y, min, max)
          consoleStore.setValue(id, snapToDetent(raw, min, max, detents))
        }}
        onPointerUp={() => {
          drag.current = null
        }}
        onPointerCancel={() => {
          drag.current = null
        }}
        onDoubleClick={() => consoleStore.setValue(id, DEFAULTS[id])}
      >
        <span className="knob-pointer" />
      </div>
      <span className="console-label" aria-hidden="true">
        {label}
      </span>
      <span className="console-value" aria-hidden="true">
        {format(value)}
      </span>
    </div>
  )
}
```

- [ ] **Step 6: Create `components/console/CueButton.tsx`**

```tsx
'use client'

import { cueLabel } from '@/content/cues'
import { consoleStore, useConsole } from '@/console/store'
import { scrollToCue } from '@/lib/scroll'

export function CueButton({ cue, label }: { cue: number; label: string }) {
  const active = useConsole((s) => s.activeCue === cue)

  return (
    <button
      type="button"
      className="cue-button"
      aria-current={active ? 'true' : undefined}
      onClick={() => {
        consoleStore.setValue('activeCue', cue)
        scrollToCue(cue)
      }}
    >
      <span className="led" data-on={active} aria-hidden="true" />
      {cueLabel(cue)}
      <span className="sr-only"> {label}</span>
    </button>
  )
}
```

- [ ] **Step 7: Create `console/useCueTracking.ts`**

```ts
'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { consoleStore } from './store'

/** Lights the cue whose section crosses the middle of the viewport. */
export function useCueTracking() {
  const pathname = usePathname()

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const sections = document.querySelectorAll<HTMLElement>('[data-cue]')
    if (sections.length === 0) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) consoleStore.setValue('activeCue', Number(entry.target.getAttribute('data-cue')))
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [pathname])
}
```

- [ ] **Step 8: Create `components/console/Console.tsx`**

```tsx
'use client'

import { CUES } from '@/content/cues'
import { useCueTracking } from '@/console/useCueTracking'
import { CueButton } from './CueButton'
import { Fader } from './Fader'
import { Knob } from './Knob'
import './console.css'

export const pct = (v: number) => `${Math.round(v * 100)}%`
export const deg = (v: number) => `${Math.round(v)}°`
export const bpm = (v: number) => `${Math.round(v)} BPM`

export function Console() {
  useCueTracking()

  return (
    <>
      <a href="#main" className="skip-link">Skip console</a>
      <section aria-label="Show console" className="console" data-lenis-prevent>
        <div className="console-group" role="group" aria-label="Cues">
          {CUES.map((c) => (
            <CueButton key={c.n} cue={c.n} label={c.label} />
          ))}
        </div>
        <div className="console-group" role="group" aria-label="Lights">
          <Fader id="master" label="Master" step={0.01} format={pct} />
          <Fader id="hue" label="Hue" step={1} format={deg} />
          <Fader id="intensity" label="Intensity" step={0.01} format={pct} />
        </div>
        <div className="console-group" role="group" aria-label="Atmosphere">
          <Knob id="tempo" label="Tempo" detents={12} format={bpm} />
          <Knob id="fog" label="Fog" detents={10} format={pct} />
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 9: Create `components/console/console.css`**

```css
.console {
  position: fixed;
  inset-inline: 0;
  bottom: 0;
  z-index: 50;
  display: flex;
  align-items: stretch;
  height: var(--console-h);
  overflow-x: auto;
  background: var(--color-panel);
  border-top: 1px solid var(--color-line);
  color: var(--color-mute);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.console-group {
  display: flex;
  flex: none;
  align-items: center;
  gap: 16px;
  padding: 12px 20px;
  border-right: 1px solid var(--color-line);
}

.console-label,
.console-value {
  display: block;
  text-align: center;
  white-space: nowrap;
}

.console-value {
  color: var(--color-ink);
}

/* LED */
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
  box-shadow:
    0 0 6px var(--color-led),
    0 0 14px color-mix(in srgb, var(--color-led) 50%, transparent);
}

/* Push buttons: 2px physical travel */
.cue-button {
  padding: 8px 10px;
  border: 1px solid var(--color-line);
  background: #141414;
  color: var(--color-ink);
  font: inherit;
  box-shadow: inset 0 -2px 0 #000;
  transition:
    transform 80ms var(--ease-mechanical),
    box-shadow 80ms var(--ease-mechanical);
}

.cue-button:active {
  transform: translateY(2px);
  box-shadow: inset 0 0 0 #000;
}

.cue-button[aria-current='true'] {
  border-color: var(--color-led);
}

/* Fader: native range turned vertical */
.fader {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.fader input[type='range'] {
  appearance: none;
  writing-mode: vertical-lr;
  direction: rtl;
  width: 20px;
  height: 52px;
  margin: 0;
  background: linear-gradient(#050505, #050505) center / 4px 100% no-repeat;
  cursor: ns-resize;
}

.fader input[type='range']::-webkit-slider-runnable-track {
  background: transparent;
}

.fader input[type='range']::-moz-range-track {
  background: transparent;
}

.fader input[type='range']::-webkit-slider-thumb {
  appearance: none;
  width: 20px;
  height: 10px;
  border: 1px solid #000;
  background: var(--color-ink);
  box-shadow: 0 2px 0 #000;
}

.fader input[type='range']::-moz-range-thumb {
  width: 20px;
  height: 10px;
  border: 1px solid #000;
  border-radius: 0;
  background: var(--color-ink);
}

/* Knob: physically round, snaps with a tiny overshoot */
.knob {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.knob-dial {
  position: relative;
  width: 36px;
  height: 36px;
  border: 1px solid #000;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #3a3a3a, #111 70%);
  box-shadow:
    0 2px 0 #000,
    inset 0 1px 0 #444;
  transform: rotate(var(--angle));
  transition: transform 140ms cubic-bezier(0.3, 1.6, 0.5, 1);
  touch-action: none;
  cursor: ns-resize;
}

.knob-pointer {
  position: absolute;
  top: 3px;
  left: 50%;
  width: 2px;
  height: 10px;
  margin-left: -1px;
  background: var(--color-ink);
}
```

- [ ] **Step 10: Run tests to verify they pass**

Run: `pnpm test components/console`
Expected: 5 PASS.

- [ ] **Step 11: Mount the console in `app/layout.tsx`**

Add `import { Console } from '@/components/console/Console'` and render it right after `<Header />`:

```tsx
        <Header />
        <Console />
        <main id="main">{children}</main>
```

- [ ] **Step 12: Checks + manual verify**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm build`
Expected: all pass.
Manual (`pnpm dev`, Chrome 1440px):
- Scroll: the active cue LED follows the section in the middle of the screen.
- Click CUE 04 → glides to Services.
- Drag the Tempo knob up/down: it rotates in detent steps; mouse wheel over the knob turns it without scrolling the page.
- Keyboard only: Tab from the top reaches "Skip console", then cues, faders (arrow keys move them), knobs (arrows, Shift+arrows, Home/End). Focus ring is red.
- 390px: console scrolls horizontally (full mobile sheet is Stage 3).

- [ ] **Step 13: Commit, PR, merge**

```bash
git add -A
git commit -m "feat(console): add faders, knobs and cue buttons

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin feat/console-controls
gh pr create --title "feat(console): add faders, knobs and cue buttons" --body "$(cat <<'EOF'
## What
Fixed show console: cue buttons (active LED follows scroll), native-range faders, role=slider knobs with detents (drag, wheel, keyboard, double-click reset), skip link.

## Why
Spec §5. Faders are real `<input type=range>` so they work with keyboard and screen readers out of the box.

## How to test
`pnpm test components/console` · `pnpm dev`: keyboard-only walkthrough, wheel over a knob does not scroll the page.

## Screenshots
(attach console close-up)

Closes #<issue for "Console controls">

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
gh pr checks --watch
gh pr merge --squash --delete-branch
git switch main && git pull --ff-only
```

---

## Task 6: Console audio (engine, Sound toggle, pads, meter)

**Files:**
- Create: `console/audio.ts`, `components/console/SoundToggle.tsx`, `components/console/Pad.tsx`, `components/console/Meter.tsx`
- Modify: `components/console/Console.tsx`, `components/console/CueButton.tsx`, `components/console/console.css`, `components/Header.tsx`
- Test: `console/audio.test.ts`, `components/console/audio-controls.test.tsx`

**Interfaces:**
- Consumes: `consoleStore` (Task 4); `<Console />`, `CueButton` (Task 5).
- Produces: `initAudio(): Promise<boolean>` (false = no Web Audio), `type PadKind = 'kick' | 'hit' | 'riser' | 'drop'`, `playPad(kind: PadKind): void`, `playClick(): void`, `readLevel(): number` (0..1 peak; 0 before init). All play functions are no-ops before init or while `soundOn` is false. `<SoundToggle />`, `<Pad kind label />`, `<Meter />`.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/console-audio
```

- [ ] **Step 2: Write the failing tests**

`console/audio.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from 'vitest'
import { initAudio, playClick, playPad, readLevel } from './audio'

describe('audio engine before start', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('reports unsupported when the browser has no AudioContext', async () => {
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('webkitAudioContext', undefined)
    expect(await initAudio()).toBe(false)
  })

  it('ignores pads and clicks, and reads silence, before audio starts', () => {
    expect(() => playPad('kick')).not.toThrow()
    expect(() => playClick()).not.toThrow()
    expect(readLevel()).toBe(0)
  })
})
```

`components/console/audio-controls.test.tsx`:
```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initAudio, playPad } from '@/console/audio'
import { consoleStore } from '@/console/store'
import { Pad } from './Pad'
import { SoundToggle } from './SoundToggle'

vi.mock('@/console/audio', () => ({
  initAudio: vi.fn(),
  playPad: vi.fn(),
  playClick: vi.fn(),
  readLevel: () => 0,
}))

describe('audio controls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    consoleStore.reset()
  })

  it('turns sound on only after audio has started', async () => {
    vi.mocked(initAudio).mockResolvedValue(true)
    render(<SoundToggle />)
    const button = screen.getByRole('button', { name: /sound/i })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(button)
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'))
    expect(consoleStore.get().soundOn).toBe(true)
  })

  it('disables itself and stays off when audio is unsupported', async () => {
    vi.mocked(initAudio).mockResolvedValue(false)
    render(<SoundToggle />)
    const button = screen.getByRole('button', { name: /sound/i })
    fireEvent.click(button)
    await waitFor(() => expect(button).toBeDisabled())
    expect(button).toHaveTextContent(/no audio/i)
    expect(consoleStore.get().soundOn).toBe(false)
  })

  it('fires a pad once per key press, ignoring auto-repeat', () => {
    render(<Pad kind="kick" label="Kick" />)
    const pad = screen.getByRole('button', { name: 'Kick' })
    fireEvent.keyDown(pad, { key: 'Enter' })
    fireEvent.keyDown(pad, { key: 'Enter', repeat: true })
    fireEvent.keyDown(pad, { key: 'Enter', repeat: true })
    expect(playPad).toHaveBeenCalledTimes(1)
    expect(playPad).toHaveBeenCalledWith('kick')
  })

  it('fires a pad on pointer down', () => {
    render(<Pad kind="drop" label="Drop" />)
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Drop' }))
    expect(playPad).toHaveBeenCalledWith('drop')
  })
})
```

- [ ] **Step 3: Run to verify they fail**

Run: `pnpm test console/audio.test.ts components/console/audio-controls.test.tsx`
Expected: FAIL, cannot resolve `./audio`, `./Pad`, `./SoundToggle`.

- [ ] **Step 4: Create `console/audio.ts`**

```ts
import { consoleStore } from './store'

export type PadKind = 'kick' | 'hit' | 'riser' | 'drop'

type Engine = {
  ctx: AudioContext
  master: GainNode
  analyser: AnalyserNode
  noise: AudioBuffer
  samples: Uint8Array<ArrayBuffer>
}

let engine: Engine | null = null

/** Creates the audio graph on first call (must come from a user gesture). Returns false without Web Audio. */
export async function initAudio(): Promise<boolean> {
  if (engine) {
    await engine.ctx.resume()
    return true
  }
  const Ctor =
    window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return false

  const ctx = new Ctor()
  const master = ctx.createGain()
  master.gain.value = 0
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 256
  master.connect(analyser)
  analyser.connect(ctx.destination)

  const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1

  engine = { ctx, master, analyser, noise, samples: new Uint8Array(analyser.fftSize) }

  // Mute follows the store; a short time constant avoids clicks.
  const applyMute = () => master.gain.setTargetAtTime(consoleStore.get().soundOn ? 0.8 : 0, ctx.currentTime, 0.02)
  consoleStore.subscribe(applyMute)
  applyMute()

  await ctx.resume()
  return true
}

function envelope(ctx: AudioContext, peak: number, attack: number, decay: number, t: number) {
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  return g
}

function noiseSource(e: Engine) {
  const src = e.ctx.createBufferSource()
  src.buffer = e.noise
  src.loop = true
  return src
}

function kick(e: Engine, t: number, length = 0.3) {
  const osc = e.ctx.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(150, t)
  osc.frequency.exponentialRampToValueAtTime(40, t + length)
  osc.connect(envelope(e.ctx, 1, 0.005, length, t)).connect(e.master)
  osc.start(t)
  osc.stop(t + length + 0.05)
}

function hit(e: Engine, t: number) {
  const src = noiseSource(e)
  const hp = e.ctx.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1200
  src.connect(hp).connect(envelope(e.ctx, 0.7, 0.002, 0.15, t)).connect(e.master)
  src.start(t)
  src.stop(t + 0.2)
}

function riser(e: Engine, t: number) {
  const dur = 2
  const lp = e.ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(200, t)
  lp.frequency.exponentialRampToValueAtTime(8000, t + dur)

  const src = noiseSource(e)
  const saw = e.ctx.createOscillator()
  saw.type = 'sawtooth'
  saw.frequency.setValueAtTime(110, t)
  saw.frequency.exponentialRampToValueAtTime(440, t + dur)

  const g = e.ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(0.4, t + dur)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.08)

  src.connect(lp)
  saw.connect(lp)
  lp.connect(g).connect(e.master)
  src.start(t)
  saw.start(t)
  src.stop(t + dur + 0.1)
  saw.stop(t + dur + 0.1)
}

function drop(e: Engine, t: number) {
  kick(e, t, 0.5)
  const sub = e.ctx.createOscillator()
  sub.type = 'sine'
  sub.frequency.value = 55
  sub.connect(envelope(e.ctx, 0.8, 0.01, 0.8, t)).connect(e.master)
  sub.start(t)
  sub.stop(t + 0.9)
}

const PADS: Record<PadKind, (e: Engine, t: number) => void> = {
  kick: (e, t) => kick(e, t),
  hit,
  riser,
  drop,
}

export function playPad(kind: PadKind) {
  if (!engine || !consoleStore.get().soundOn) return
  PADS[kind](engine, engine.ctx.currentTime)
}

export function playClick() {
  if (!engine || !consoleStore.get().soundOn) return
  const t = engine.ctx.currentTime
  const src = noiseSource(engine)
  src.connect(envelope(engine.ctx, 0.05, 0.0005, 0.002, t)).connect(engine.master)
  src.start(t)
  src.stop(t + 0.01)
}

/** Peak level 0..1 of the current output; 0 before audio starts. */
export function readLevel(): number {
  if (!engine) return 0
  const buf = engine.samples
  engine.analyser.getByteTimeDomainData(buf)
  let peak = 0
  for (const v of buf) peak = Math.max(peak, Math.abs(v - 128) / 128)
  return peak
}
```

- [ ] **Step 5: Create `components/console/SoundToggle.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { initAudio } from '@/console/audio'
import { consoleStore, useConsole } from '@/console/store'

export function SoundToggle() {
  const on = useConsole((s) => s.soundOn)
  const [unsupported, setUnsupported] = useState(false)

  async function toggle() {
    if (!on && !(await initAudio())) {
      setUnsupported(true)
      return
    }
    consoleStore.set({ soundOn: !on })
  }

  return (
    <button type="button" className="sound-toggle" aria-pressed={on} disabled={unsupported} onClick={toggle}>
      <span className="led" data-on={on} aria-hidden="true" />
      {unsupported ? 'No audio' : 'Sound'}
      {!unsupported && (
        <span className="sound-state" aria-hidden="true">
          {on ? 'On' : 'Off'}
        </span>
      )}
    </button>
  )
}
```

- [ ] **Step 6: Create `components/console/Pad.tsx`**

```tsx
'use client'

import { useRef, useState } from 'react'
import { type PadKind, playPad } from '@/console/audio'

export function Pad({ kind, label }: { kind: PadKind; label: string }) {
  const [lit, setLit] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const fire = () => {
    playPad(kind)
    setLit(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setLit(false), 140)
  }

  return (
    <button
      type="button"
      className="pad"
      data-lit={lit}
      onPointerDown={fire}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
          e.preventDefault()
          fire()
        }
      }}
    >
      {label}
    </button>
  )
}
```

- [ ] **Step 7: Create `components/console/Meter.tsx`**

```tsx
'use client'

import { type CSSProperties, useEffect, useRef } from 'react'
import { readLevel } from '@/console/audio'

const SEGMENTS = 12

export function Meter() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let raf = 0
    const loop = (t: number) => {
      const idle = reduced ? 0 : (Math.sin(t / 400) + 1) * 0.04
      ref.current?.style.setProperty('--level', String(Math.max(readLevel(), idle)))
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div ref={ref} className="meter" aria-hidden="true">
      {Array.from({ length: SEGMENTS }, (_, i) => (
        <span key={i} style={{ '--i': i } as CSSProperties} />
      ))}
    </div>
  )
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `pnpm test console/audio.test.ts components/console/audio-controls.test.tsx`
Expected: 6 PASS.

- [ ] **Step 9: Wire into the console — replace `components/console/Console.tsx`**

```tsx
'use client'

import type { PadKind } from '@/console/audio'
import { CUES } from '@/content/cues'
import { useCueTracking } from '@/console/useCueTracking'
import { CueButton } from './CueButton'
import { Fader } from './Fader'
import { Knob } from './Knob'
import { Meter } from './Meter'
import { Pad } from './Pad'
import { SoundToggle } from './SoundToggle'
import './console.css'

export const pct = (v: number) => `${Math.round(v * 100)}%`
export const deg = (v: number) => `${Math.round(v)}°`
export const bpm = (v: number) => `${Math.round(v)} BPM`

const PADS: { kind: PadKind; label: string }[] = [
  { kind: 'kick', label: 'Kick' },
  { kind: 'hit', label: 'Hit' },
  { kind: 'riser', label: 'Riser' },
  { kind: 'drop', label: 'Drop' },
]

export function Console() {
  useCueTracking()

  return (
    <>
      <a href="#main" className="skip-link">Skip console</a>
      <section aria-label="Show console" className="console" data-lenis-prevent>
        <div className="console-group">
          <SoundToggle />
        </div>
        <div className="console-group" role="group" aria-label="Cues">
          {CUES.map((c) => (
            <CueButton key={c.n} cue={c.n} label={c.label} />
          ))}
        </div>
        <div className="console-group" role="group" aria-label="Lights">
          <Fader id="master" label="Master" step={0.01} format={pct} />
          <Fader id="hue" label="Hue" step={1} format={deg} />
          <Fader id="intensity" label="Intensity" step={0.01} format={pct} />
        </div>
        <div className="console-group" role="group" aria-label="Atmosphere">
          <Knob id="tempo" label="Tempo" detents={12} format={bpm} />
          <Knob id="fog" label="Fog" detents={10} format={pct} />
        </div>
        <div className="console-group" role="group" aria-label="Pads">
          {PADS.map((p) => (
            <Pad key={p.kind} kind={p.kind} label={p.label} />
          ))}
        </div>
        <div className="console-group">
          <Meter />
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 10: Click sound on cue buttons — modify `components/console/CueButton.tsx`**

Add `import { playClick } from '@/console/audio'` and call it first in `onClick`:

```tsx
      onClick={() => {
        playClick()
        consoleStore.setValue('activeCue', cue)
        scrollToCue(cue)
      }}
```

Then add the same mock to the top of `components/console/Console.test.tsx` (next to the existing `vi.mock` lines) so the Task 5 tests stay isolated from Web Audio:

```tsx
vi.mock('@/console/audio', () => ({ initAudio: vi.fn(), playPad: vi.fn(), playClick: vi.fn(), readLevel: () => 0 }))
```

- [ ] **Step 11: Sound toggle in the header — modify `components/Header.tsx`**

Add `import { SoundToggle } from '@/components/console/SoundToggle'` and render it after the `<nav>`:

```tsx
      </nav>
      <SoundToggle />
    </header>
```

(Header stays a server component; `SoundToggle` is a client component. Both toggles share the store, so they stay in sync.)

- [ ] **Step 12: Append styles to `components/console/console.css`**

```css
.sound-toggle,
.pad {
  border: 1px solid var(--color-line);
  background: #141414;
  color: var(--color-ink);
  font-family: var(--font-mono);
  font-size: 11px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  box-shadow: inset 0 -2px 0 #000;
  transition:
    transform 80ms var(--ease-mechanical),
    box-shadow 80ms var(--ease-mechanical),
    background 80ms var(--ease-mechanical);
}

.sound-toggle {
  padding: 8px 10px;
}

.sound-state {
  margin-left: 8px;
  color: var(--color-mute);
}

.sound-toggle:disabled {
  opacity: 0.5;
}

.pad {
  width: 48px;
  height: 48px;
  padding: 0;
}

.sound-toggle:active,
.pad:active,
.pad[data-lit='true'] {
  transform: translateY(2px);
  box-shadow: inset 0 0 0 #000;
}

.pad[data-lit='true'] {
  background: var(--color-led);
  color: var(--color-stage);
}

.meter {
  display: flex;
  flex-direction: column-reverse;
  gap: 2px;
  width: 8px;
}

.meter span {
  height: 4px;
  background: var(--color-ink);
  opacity: clamp(0.12, calc((var(--level, 0) * 12 - var(--i)) * 4), 1);
}

.meter span:nth-child(n + 10) {
  background: var(--color-led);
}
```

- [ ] **Step 13: Full checks + manual verify**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm build`
Expected: all pass (5 test files from earlier tasks + 2 new).
Manual (`pnpm dev`, Chrome):
- Load: no sound. Meter shows a faint idle shimmer.
- Press pads before Sound: pads light up, silent.
- Press Sound (console or header): LED lights in both places, "On". Pads: kick thumps, hit snaps, riser sweeps up for 2 s, drop hits low. Meter jumps with each sound; top segments go red on loud hits.
- Cue buttons click quietly when sound is on.
- Hold Enter on a focused pad: one hit only.
- Press Sound again: everything mutes smoothly (no click).
- Reduced-motion emulation: no idle shimmer; meter still reacts to real sound.

- [ ] **Step 14: Commit, PR, merge**

```bash
git add -A
git commit -m "feat(console): add synthesized pads, sound toggle and level meter

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -u origin feat/console-audio
gh pr create --title "feat(console): add synthesized pads, sound toggle and level meter" --body "$(cat <<'EOF'
## What
Native Web Audio engine created on the first Sound press; kick / hit / riser / drop synthesized from oscillators and noise (no audio files). Sound toggle in console + header, pads with one-hit-per-press, analyser-driven level meter, quiet click on cue buttons.

## Why
Spec §5 pads/meter, §7 audio. Sound never autoplays; unsupported browsers get a disabled "No audio" button instead of errors.

## How to test
`pnpm test` · `pnpm dev`: press pads before and after Sound; hold Enter on a pad.

## Screenshots
(attach console with Sound on)

Closes #<issue for "Console audio">

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
gh pr checks --watch
gh pr merge --squash --delete-branch
git switch main && git pull --ff-only
```

---

## Stage 1 checkpoint (PM review)

- [ ] Production URL (Vercel, if connected) or `pnpm dev` shows: skeleton sections, smooth scroll, full console.
- [ ] Keyboard-only walkthrough of the whole page and console works; red focus ring everywhere.
- [ ] Reduced-motion emulation: native scroll, instant cue jumps, no idle shimmer.
- [ ] All 5 Stage 1 issues closed; milestone "Stage 1" at 100%.
- [ ] Screenshots (1440px, 390px) shared with the PM. PM feedback feeds the Stage 2 plan.
