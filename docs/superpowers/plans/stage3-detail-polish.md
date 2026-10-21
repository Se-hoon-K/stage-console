# Stage 3 — Detail + Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the linkable MVP: event detail pages that reuse the stage engine, page transitions, a "sound check" preloader, a "no signal" 404, a phone-friendly console and menu, the hero title stepping aside for the stage, and a final README — verified on desktop, phone, reduced motion and no-WebGL, then tagged `v0.1.0`.

**Architecture:** A `useStageSection(ref, { seed })` hook (extracted from the hero) binds any section to the persistent canvas: it sets the stage seed, tracks visibility, pins the section and drives `stageView.progress` from scroll, and writes `--assembly` on the section for CSS. The hero and the new `/events/[slug]` page both use it; the canvas re-keys on seed. Navigation goes through `TransitionLink` (closes a global shutter, then `router.push`) and `app/template.tsx` (opens it). The preloader, 404 and mobile console are self-contained client components.

**Tech Stack:** Next.js 16.4 App Router (async `params`), React 19.3, GSAP 3.15 (ScrollTrigger), Lenis 1.3, R3F 9.8, Vitest 5.

**Spec:** `docs/superpowers/specs/portfolio-design.md` (§4.1 Preloader, §4.3 Event detail, §4.4 404, §4.5 Transitions, §5 Mobile console, §11 A11y, §12 Perf, §14 Stage 3, §16 Releases)

**Inputs carried from Stage 2:** final-review recommendation to extract `useStageSection(seed)`; PM default decision (a) for the hero title; Work rows become links with focus behaviour; phone header nav overflow; duplicate `.led`; first-load JS ≈ 240 KB of the ~250 KB budget; Stage 3 final browser check must include phone, reduced motion, WebGL-off. Issue #14 (Safari audio) stays blocked on the PM's probe.

## Global Constraints

- Repo `Se-hoon-K/stage-console`; one branch + PR per task, Conventional Commits, CI `check` green, squash-merge.
- **No `Co-Authored-By` trailer in commits. No "Generated with Claude Code" line in PR bodies.**
- Commit identity is repo-local; never change git config.
- Colours: stage `#0E0E0E`, panel `#1A1A1A`, line `#2E2E2E`, ink/paper `#EDEBE6`, mute `#8A8780`, LED `#FF3B1F` (lit only). No border radius except round physical parts; no decorative shadows.
- `prefers-reduced-motion: reduce` → no pin, assembled stage, no shutter animation (instant navigation), preloader is a short fade, no stat count-up, no noise animation, no title movement.
- Every new page/section: semantic landmarks, one `h1` per page, real links, visible focus.
- First-load JS for `/` must stay ≤ ~250 KB gzip; no new runtime dependencies in this stage.
- Unknown event slug → the 404 page, never a crash.
- Modified clicks (⌘/Ctrl/Shift/Alt, middle button, `target="_blank"`) on any `TransitionLink` keep browser default behaviour.
- `sessionStorage` may throw (Safari private mode, blocked storage) → wrap every access in try/catch.
- Agency name `agency.name = '[AGENCY]'`; credits always visible.

## Review Focus

1. **Navigating home ↔ event (incl. back/forward and direct loads)** → the canvas shows the right seed, progress is in sync with scroll, no stale "assembled" stage at the top. Pinned in Task 1 (hook syncs seed + progress on mount) and Task 3 (event page sets its seed).
2. **Modified clicks on transition links** → new tab / browser default, no shutter, no `router.push`. Pinned in Task 2.
3. **Storage blocked** → preloader still runs and finishes without crashing. Pinned in Task 5.
4. **Unknown event slug** → `notFound()` (404 page). Pinned in Task 3.
5. **Phone console** → collapsed by default, opens/closes with its button and Escape, everything inside stays keyboard-reachable. Pinned in Task 7.

## File Structure

```
stage/useStageSection.ts (+test)          pin/visibility/seed/progress hook, writes --assembly        T1
components/sections/HeroStage.tsx          uses the hook; title CSS reacts to --assembly                T1
lib/transition.ts (+test)                  closeShutter / openShutter                                   T2
components/TransitionLink.tsx (+test)      shutter-then-push link                                       T2
app/template.tsx                           opens shutter, resets scroll, refreshes triggers on route    T2
components/Header.tsx, components/HeaderNav.tsx (+test)  links via TransitionLink, phone menu         T2, T7
app/events/[slug]/page.tsx (+test)         event detail page                                            T3
components/event/EventStage.tsx            pinned stage section for the event seed                      T3
components/event/RunSheet.tsx (+test)      cue list, current item follows scroll                        T3
components/event/StatCounter.tsx (+test)   count-up number                                              T3
components/sections/WorkList.tsx (+test)   rows become links; focus lights the row                      T4
components/Preloader.tsx (+test)           "sound check" first-visit overlay                            T5
app/not-found.tsx, components/NoiseCanvas.tsx (+test)   "no signal" page                              T6
components/console/Console.tsx, console.css (+test)     phone bar + collapsible panel                 T7
app/globals.css, README.md                 cleanup + final README                                       T8
```

## Deferred (not in Stage 3)

- Safari audio (#14) — waiting on the PM's Safari probe output.
- Gallery images on event pages — the PM has not chosen a source (AI vs CC0); the gallery section renders only when `show.images` is non-empty, which none are yet.
- Preloader LEDs physically sliding into the console channel strip; console LED flash when stage lights switch on; sub-woofers, shadows, context-loss recovery.

---

## Task 0: Commit this plan and open issues (controller)

- [ ] **Step 1:** branch `docs/stage3-plan`, commit this file (`docs: add stage 3 implementation plan`), PR, merge.
- [ ] **Step 2:** create one issue per Task 1–8 in milestone `Stage 3: Detail + polish`.

---

## Task 1: `useStageSection` hook and the hero title stepping aside

**Files:**
- Create: `stage/useStageSection.ts`, `stage/useStageSection.test.tsx`
- Modify: `components/sections/HeroStage.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `stageView` (`stage/view.ts`), `gsap`, `ScrollTrigger` (`lib/gsap.ts`; Vitest manual mock `lib/__mocks__/gsap.ts` where `ScrollTrigger.create` returns `{ kill, progress: 0 }`).
- Produces: `useStageSection(ref: RefObject<HTMLElement | null>, options: { seed: number; end?: string }): void` — on mount: `stageView.set({ seed })`; IntersectionObserver → `visible`; reduced motion → `progress: 1` and no pin; otherwise a pinned scrubbed ScrollTrigger (`start: 'top top'`, `end` default `'+=150%'`) whose progress goes to `stageView.progress` **and** to the section's `--assembly` CSS variable (also synced once right after creation). On unmount: revert, disconnect, `visible: false`. The section is `ref.current.closest('section') ?? ref.current`.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/stage-section-hook
```

- [ ] **Step 2: Write the failing test `stage/useStageSection.test.tsx`**

```tsx
import { render } from '@testing-library/react'
import { useRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ScrollTrigger } from '@/lib/gsap'
import { stageView } from './view'
import { useStageSection } from './useStageSection'

vi.mock('@/lib/gsap')

function Probe({ seed, end }: { seed: number; end?: string }) {
  const ref = useRef<HTMLElement>(null)
  useStageSection(ref, { seed, end })
  return <section ref={ref} data-testid="s" />
}

const defaultMatchMedia = (q: string) =>
  ({ matches: false, media: q, onchange: null, addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn() }) as unknown as MediaQueryList

describe('useStageSection', () => {
  beforeEach(() => {
    stageView.reset()
    vi.mocked(ScrollTrigger.create).mockClear()
  })
  afterEach(() => vi.mocked(window.matchMedia).mockImplementation(defaultMatchMedia))

  it('sets the seed and pins the section with the given scroll length', () => {
    render(<Probe seed={314} end="+=120%" />)
    expect(stageView.get().seed).toBe(314)
    const config = vi.mocked(ScrollTrigger.create).mock.calls[0][0] as unknown as { pin: boolean; end: string }
    expect(config.pin).toBe(true)
    expect(config.end).toBe('+=120%')
  })

  it('syncs progress from the trigger on mount, so a remount never shows a stale stage', () => {
    stageView.set({ progress: 1 })
    render(<Probe seed={7} />)
    expect(stageView.get().progress).toBe(0)
  })

  it('mirrors scroll progress into stageView and the --assembly CSS variable', () => {
    const { getByTestId } = render(<Probe seed={7} />)
    const config = vi.mocked(ScrollTrigger.create).mock.calls[0][0] as unknown as { onUpdate: (s: { progress: number }) => void }
    config.onUpdate({ progress: 0.4 })
    expect(stageView.get().progress).toBe(0.4)
    expect(getByTestId('s').style.getPropertyValue('--assembly')).toBe('0.4')
  })

  it('shows the assembled stage without pinning or moving the title under reduced motion', () => {
    vi.mocked(window.matchMedia).mockImplementation((q: string) => ({ ...defaultMatchMedia(q), matches: q.includes('reduce') }) as MediaQueryList)
    const { getByTestId } = render(<Probe seed={7} />)
    expect(ScrollTrigger.create).not.toHaveBeenCalled()
    expect(stageView.get().progress).toBe(1)
    expect(getByTestId('s').style.getPropertyValue('--assembly')).toBe('')
  })

  it('hands the canvas back on unmount', () => {
    const { unmount } = render(<Probe seed={7} />)
    stageView.set({ visible: true })
    unmount()
    expect(stageView.get().visible).toBe(false)
  })
})
```

- [ ] **Step 3: Run to verify it fails**

Run: `pnpm test stage/useStageSection.test.tsx` → FAIL (module missing).

- [ ] **Step 4: Create `stage/useStageSection.ts`**

```ts
'use client'

import { type RefObject, useEffect } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { stageView } from './view'

type Options = { seed: number; end?: string }

/** Binds a section to the persistent stage canvas: seed, visibility and scroll-driven assembly. */
export function useStageSection(ref: RefObject<HTMLElement | null>, { seed, end = '+=150%' }: Options) {
  useEffect(() => {
    const node = ref.current
    const section = node?.closest('section') ?? node
    if (!section) return
    stageView.set({ seed })

    let io: IntersectionObserver | undefined
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(([entry]) => stageView.set({ visible: entry.isIntersecting }))
      io.observe(section)
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stageView.set({ progress: 1 })
      return () => {
        io?.disconnect()
        stageView.set({ visible: false })
      }
    }

    const apply = (progress: number) => {
      stageView.set({ progress })
      section.style.setProperty('--assembly', String(progress))
    }
    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end,
        pin: true,
        scrub: true,
        onUpdate: (self) => apply(self.progress),
      })
      apply(trigger.progress)
    }, section)

    return () => {
      ctx.revert()
      io?.disconnect()
      stageView.set({ visible: false })
    }
  }, [ref, seed, end])
}
```

- [ ] **Step 5: Run the hook test** → PASS.

- [ ] **Step 6: Use the hook in `components/sections/HeroStage.tsx`**

Replace the whole `useEffect` with the hook plus a title-only effect, keeping everything else (SVG layer, sr-only text, HUD) unchanged:

```tsx
  useStageSection(ref, { seed: agency.heroSeed })

  useEffect(() => {
    const section = ref.current?.closest('section')
    const title = section?.querySelector('h1')
    if (!section || !title || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      const split = SplitText.create(title, { type: 'lines,chars', mask: 'lines' })
      gsap.from(split.chars, { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.02 })
    }, section)
    return () => ctx.revert()
  }, [])
```

Imports: add `import { useStageSection } from '@/stage/useStageSection'`; remove `ScrollTrigger` and `stageView` from imports if now unused (keep `useStageView`). The existing `HeroStage.test.tsx` must still pass unchanged (it asserts pin, `end: '+=150%'`, reduced-motion 100% and the sr-only text).

- [ ] **Step 7: Title steps aside as the stage builds — append to `app/globals.css`**

```css
/* Hero title rises and dims as the stage assembles (decision a). --assembly is 0–1, set by useStageSection. */
#cue-1 h1 {
  transform: translateY(calc(var(--assembly, 0) * -22vh));
  opacity: calc(1 - var(--assembly, 0) * 0.85);
  will-change: transform, opacity;
}
```

- [ ] **Step 8: Checks** — `pnpm test && pnpm lint && pnpm typecheck && pnpm build` → all pass.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(stage): extract useStageSection and let the hero title step aside as the stage builds"
```

---

## Task 2: Page transitions and route-safe header links

**Files:**
- Create: `lib/transition.ts`, `lib/transition.test.ts`, `components/TransitionLink.tsx`, `components/TransitionLink.test.tsx`, `app/template.tsx`
- Modify: `lib/scroll.ts` (export `getLenis`), `app/layout.tsx` (shutter element), `app/globals.css` (shutter), `components/Header.tsx` (links), `vitest.setup.ts` (global `next/link` mock)

**Interfaces:**
- Consumes: `gsap` (`lib/gsap.ts`), `ScrollTrigger.refresh`, Lenis via `getLenis()`.
- Produces: `closeShutter(): Promise<void>` (resolves immediately under reduced motion or without `#shutter`), `openShutter(): void` (no-op unless the shutter was closed by `closeShutter`), `getLenis(): Lenis | null`, `<TransitionLink href={string} …LinkProps />`.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/page-transitions
```

- [ ] **Step 2: Write the failing tests**

`lib/transition.test.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { gsap } from '@/lib/gsap'
import { closeShutter, openShutter } from './transition'

vi.mock('@/lib/gsap')

describe('shutter', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="shutter"></div>'
    openShutter() // resets the module's "closed" flag so tests don't depend on order
    vi.mocked(gsap.fromTo).mockReset()
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('closes with an animation and resolves when it completes', async () => {
    vi.mocked(gsap.fromTo).mockImplementation(((_t: unknown, _f: unknown, to: { onComplete?: () => void }) => {
      to.onComplete?.()
    }) as never)
    await expect(closeShutter()).resolves.toBeUndefined()
    expect(gsap.fromTo).toHaveBeenCalledTimes(1)
  })

  it('does not open on first load (nothing was closed)', () => {
    openShutter()
    expect(gsap.fromTo).not.toHaveBeenCalled()
  })

  it('opens after a close', async () => {
    vi.mocked(gsap.fromTo).mockImplementation(((_t: unknown, _f: unknown, to: { onComplete?: () => void }) => {
      to.onComplete?.()
    }) as never)
    await closeShutter()
    openShutter()
    expect(gsap.fromTo).toHaveBeenCalledTimes(2)
  })

  it('skips the animation under reduced motion', async () => {
    vi.mocked(window.matchMedia).mockReturnValueOnce({ matches: true } as MediaQueryList)
    await closeShutter()
    expect(gsap.fromTo).not.toHaveBeenCalled()
  })
})
```

`components/TransitionLink.test.tsx`:
```tsx
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { closeShutter } from '@/lib/transition'
import { TransitionLink } from './TransitionLink'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/lib/transition', () => ({ closeShutter: vi.fn(() => Promise.resolve()), openShutter: vi.fn() }))

describe('TransitionLink', () => {
  beforeEach(() => {
    push.mockClear()
    vi.mocked(closeShutter).mockClear()
  })

  it('closes the shutter, then navigates', async () => {
    render(<TransitionLink href="/events/night-signal">Night Signal</TransitionLink>)
    const link = screen.getByRole('link', { name: 'Night Signal' })
    const notPrevented = fireEvent.click(link, { button: 0 })
    expect(notPrevented).toBe(false)
    await waitFor(() => expect(push).toHaveBeenCalledWith('/events/night-signal'))
    expect(closeShutter).toHaveBeenCalledTimes(1)
  })

  it.each([{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { altKey: true }, { button: 1 }])(
    'keeps browser default for modified clicks %o',
    (mods) => {
      render(<TransitionLink href="/events/night-signal">Go</TransitionLink>)
      fireEvent.click(screen.getByRole('link', { name: 'Go' }), { button: 0, ...mods })
      expect(closeShutter).not.toHaveBeenCalled()
      expect(push).not.toHaveBeenCalled()
    },
  )

  it('keeps browser default for target=_blank', () => {
    render(
      <TransitionLink href="/events/night-signal" target="_blank">
        New tab
      </TransitionLink>,
    )
    fireEvent.click(screen.getByRole('link', { name: 'New tab' }), { button: 0 })
    expect(push).not.toHaveBeenCalled()
  })

  it('leaves same-page anchors to the page', () => {
    render(<TransitionLink href="/#cue-3">Work</TransitionLink>)
    fireEvent.click(screen.getByRole('link', { name: 'Work' }), { button: 0 })
    expect(closeShutter).not.toHaveBeenCalled()
  })
})
```

(jsdom's `location.pathname` is `/`, so `/#cue-3` is same-page.)

- [ ] **Step 3: Mock `next/link` for every test — append to `vitest.setup.ts`**

Next's `<Link>` needs the App Router context, which jsdom tests don't have. Render it as a plain anchor in tests:
```ts
vi.mock('next/link', async () => {
  const { createElement } = await import('react')
  return {
    default: ({ href, children, ...rest }: { href: string; children?: unknown } & Record<string, unknown>) =>
      createElement('a', { href, ...rest }, children as never),
  }
})
```

- [ ] **Step 3b: Run to verify they fail** — `pnpm test lib/transition.test.ts components/TransitionLink.test.tsx` → FAIL (modules missing).

- [ ] **Step 4: Create `lib/transition.ts`**

```ts
import { gsap } from '@/lib/gsap'

let closed = false
const shutter = () => document.getElementById('shutter')
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Blackout: the shutter drops over the page. Resolves when the screen is covered. */
export function closeShutter(): Promise<void> {
  const el = shutter()
  if (!el || reduced()) return Promise.resolve()
  closed = true
  return new Promise((resolve) => {
    gsap.fromTo(
      el,
      { scaleY: 0, transformOrigin: '50% 100%' },
      { scaleY: 1, duration: 0.45, ease: 'power3.in', onComplete: () => resolve() },
    )
  })
}

/** Lights up: the shutter lifts off the new page. No-op unless closeShutter ran. */
export function openShutter() {
  const el = shutter()
  if (!el || !closed) return
  closed = false
  gsap.fromTo(el, { scaleY: 1, transformOrigin: '50% 0%' }, { scaleY: 0, duration: 0.6, ease: 'power3.out', delay: 0.05 })
}
```

- [ ] **Step 5: Create `components/TransitionLink.tsx`**

```tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentProps, MouseEvent } from 'react'
import { closeShutter } from '@/lib/transition'

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string }

/** Link that drops the shutter before navigating. Modified clicks and same-page anchors keep browser defaults. */
export function TransitionLink({ href, onClick, target, ...rest }: Props) {
  const router = useRouter()

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || target === '_blank') return
    const url = new URL(href, window.location.href)
    if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return
    e.preventDefault()
    void closeShutter().then(() => router.push(href))
  }

  return <Link href={href} target={target} onClick={handle} {...rest} />
}
```

- [ ] **Step 6: Export Lenis — `lib/scroll.ts`**

Add below `isGliding`:
```ts
export const getLenis = () => lenis
```

- [ ] **Step 7: Create `app/template.tsx`**

```tsx
'use client'

import { type ReactNode, useEffect } from 'react'
import { ScrollTrigger } from '@/lib/gsap'
import { getLenis } from '@/lib/scroll'
import { openShutter } from '@/lib/transition'

/** Runs on every navigation: start at the top, re-measure scroll triggers, lift the shutter. */
export default function Template({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.location.hash === '') {
      getLenis()?.scrollTo(0, { immediate: true })
      window.scrollTo(0, 0)
    }
    ScrollTrigger.refresh()
    openShutter()
  }, [])
  return children
}
```

- [ ] **Step 8: Shutter element and styles**

`app/layout.tsx`: render `<div id="shutter" aria-hidden="true" className="shutter" />` as the last child of `<body>` (after `<Footer />`).

Append to `app/globals.css`:
```css
.shutter {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: var(--color-panel);
  transform: scaleY(0);
  pointer-events: none;
}
```

- [ ] **Step 9: Header links work from every route — `components/Header.tsx`**

Import `TransitionLink` and use it for the logo (`href="/"`) and every nav item with `href={`/#cue-${c.n}`}` (instead of `#cue-${c.n}`), keeping classes. (On `/` these are same-page anchors and keep their current behaviour; on other routes they transition home and land on the section.)

- [ ] **Step 10: Checks** — `pnpm test && pnpm lint && pnpm typecheck && pnpm build` → all pass.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(nav): add blackout shutter page transitions and route-safe header links"
```

---

## Task 3: Event detail page

**Files:**
- Create: `app/events/[slug]/page.tsx`, `app/events/[slug]/page.test.tsx`, `components/event/EventStage.tsx`, `components/event/RunSheet.tsx`, `components/event/RunSheet.test.tsx`, `components/event/StatCounter.tsx`, `components/event/StatCounter.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `shows`, `Show` (`content/shows.ts`); `agency`; `useStageSection` (Task 1); `TransitionLink` (Task 2); `generateStage`, `StageSvg`, `assembledCount`, `useStageView`, `useConsole`; `gsap` (`lib/gsap.ts`).
- Produces: route `/events/[slug]` for every show (`generateStaticParams`), `generateMetadata`; `<EventStage seed name />`; `<RunSheet items />`; `<StatCounter value unit? />`; `formatShowDate(iso: string): string` (e.g. `14 Mar 2026`, UTC).

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/event-page
```

- [ ] **Step 2: Write the failing tests**

`app/events/[slug]/page.test.tsx`:
```tsx
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import EventPage, { formatShowDate, generateStaticParams } from './page'

vi.mock('@/lib/gsap')
vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND')
  }),
  useRouter: () => ({ push: vi.fn() }),
}))

const params = (slug: string) => ({ params: Promise.resolve({ slug }) })

describe('event page', () => {
  it('builds a page per show', () => {
    expect(generateStaticParams()).toEqual(
      expect.arrayContaining([{ slug: 'night-signal' }, { slug: 'daybreak-summit' }]),
    )
  })

  it('formats dates the same everywhere', () => {
    expect(formatShowDate('2026-03-14')).toBe('14 Mar 2026')
  })

  it('renders the featured show: title, spec sheet, stage, run sheet, numbers, next show', async () => {
    render(await EventPage(params('night-signal')))
    expect(screen.getByRole('heading', { level: 1, name: 'Night Signal' })).toBeInTheDocument()
    const specs = screen.getByRole('list', { name: 'Show facts' })
    expect(within(specs).getByText('Docklands Yard')).toBeInTheDocument()
    expect(within(specs).getByText('18,000')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Night Signal stage' })).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Run sheet' }).querySelectorAll('li')).toHaveLength(5)
    expect(screen.getByText('38')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Harbour Lights/ })).toHaveAttribute('href', '/events/harbour-lights')
  })

  it('omits empty sections for shows without a run sheet or stats', async () => {
    render(await EventPage(params('harbour-lights')))
    expect(screen.queryByRole('list', { name: 'Run sheet' })).toBeNull()
    expect(screen.queryByRole('heading', { name: 'By the numbers' })).toBeNull()
  })

  it('wraps from the last show back to the first', async () => {
    render(await EventPage(params('daybreak-summit')))
    expect(screen.getByRole('link', { name: /Night Signal/ })).toHaveAttribute('href', '/events/night-signal')
  })

  it('sends unknown slugs to the 404 page', async () => {
    await expect(EventPage(params('nope'))).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
```

`components/event/RunSheet.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'
import { RunSheet } from './RunSheet'

it('lists cues in order and marks the first as current', () => {
  render(
    <RunSheet
      items={[
        { time: '16:00', cue: 'Doors' },
        { time: '18:30', cue: 'Act 1' },
      ]}
    />,
  )
  const items = screen.getByRole('list', { name: 'Run sheet' }).querySelectorAll('li')
  expect(items).toHaveLength(2)
  expect(items[0]).toHaveTextContent('16:00')
  expect(items[0]).toHaveTextContent('Doors')
  expect(items[0]).toHaveAttribute('aria-current', 'step')
  expect(items[1]).not.toHaveAttribute('aria-current')
})
```

`components/event/StatCounter.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { StatCounter } from './StatCounter'

vi.mock('@/lib/gsap')

it('renders the final, formatted value (server/no-JS/reduced motion see the real number)', () => {
  render(<StatCounter value={18000} />)
  expect(screen.getByText('18,000')).toBeInTheDocument()
})

it('renders the unit next to the number', () => {
  render(<StatCounter value={38} unit="km" />)
  expect(screen.getByText('38')).toBeInTheDocument()
  expect(screen.getByText('km')).toBeInTheDocument()
})
```

- [ ] **Step 3: Run to verify they fail** — `pnpm test app/events components/event` → FAIL (modules missing).

- [ ] **Step 4: Create `components/event/StatCounter.tsx`**

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { gsap } from '@/lib/gsap'

const format = (n: number) => Math.round(n).toLocaleString('en-AU')

/** Counts up once when scrolled into view. Renders the real number first, so no-JS and reduced motion are correct. */
export function StatCounter({ value, unit }: { value: number; unit?: string }) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const counter = { v: 0 }
    el.textContent = format(0)
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      gsap.to(counter, { v: value, duration: 1.2, ease: 'power2.out', onUpdate: () => (el.textContent = format(counter.v)) })
    })
    io.observe(el)
    return () => {
      io.disconnect()
      el.textContent = format(value)
    }
  }, [value])

  return (
    <span className="stat-value">
      <span ref={ref}>{format(value)}</span>
      {unit && <span className="stat-unit">{unit}</span>}
    </span>
  )
}
```

- [ ] **Step 5: Create `components/event/RunSheet.tsx`**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'

type Item = { time: string; cue: string }

/** The show's cue list; the cue in the middle of the screen is "current". */
export function RunSheet({ items }: { items: Item[] }) {
  const [current, setCurrent] = useState(0)
  const list = useRef<HTMLOListElement>(null)

  useEffect(() => {
    const el = list.current
    if (!el || !('IntersectionObserver' in window)) return
    const rows = [...el.querySelectorAll<HTMLLIElement>('li')]
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setCurrent(rows.indexOf(entry.target as HTMLLIElement))
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    rows.forEach((r) => io.observe(r))
    return () => io.disconnect()
  }, [items.length])

  return (
    <section aria-labelledby="run-sheet-title" className="border-t border-line bg-stage px-5 py-24 md:px-10">
      <h2 id="run-sheet-title" className="label mb-10">
        Run sheet
      </h2>
      <ol ref={list} aria-label="Run sheet" className="border-t border-line">
        {items.map((item, i) => (
          <li
            key={`${item.time}-${item.cue}`}
            aria-current={i === current ? 'step' : undefined}
            className="run-row grid grid-cols-[6rem_1fr] items-baseline gap-4 border-b border-line py-6 md:grid-cols-[10rem_1fr]"
          >
            <span className="label">
              <span className="led" data-on={i === current} aria-hidden="true" />
              {item.time}
            </span>
            <span className="run-cue text-[clamp(1.75rem,5vw,4.5rem)] font-extrabold uppercase leading-none">{item.cue}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
```

- [ ] **Step 6: Create `components/event/EventStage.tsx`**

```tsx
'use client'

import { useMemo, useRef } from 'react'
import { useConsole } from '@/console/store'
import { assembledCount } from '@/stage/assembly'
import { generateStage } from '@/stage/generateStage'
import { StageSvg } from '@/stage/StageSvg'
import { useStageSection } from '@/stage/useStageSection'
import { useStageView } from '@/stage/view'

/** Pinned, transparent section that shows this show's own stage on the shared canvas. */
export function EventStage({ seed, name }: { seed: number; name: string }) {
  const ref = useRef<HTMLElement>(null)
  useStageSection(ref, { seed })
  const stage = useMemo(() => generateStage(seed), [seed])
  const hue = useConsole((s) => s.hue)
  const webglReady = useStageView((s) => s.webglReady)
  const percent = useStageView((s) => Math.round(s.progress * 100))

  return (
    <section ref={ref} aria-label={`${name} stage`} className="relative isolate h-[calc(100svh-var(--console-h))]">
      <StageSvg
        stage={stage}
        hue={hue}
        className={`absolute inset-x-0 top-[12%] mx-auto h-[60%] w-full transition-opacity duration-700 ${webglReady ? 'opacity-0' : 'opacity-100'}`}
      />
      <p className="sr-only">The stage built for {name} assembles as you scroll.</p>
      <div className="label absolute right-5 top-6 space-y-1 text-right md:right-10" aria-hidden="true">
        <p>ASSEMBLY {String(percent).padStart(3, '0')}%</p>
        <p>
          PARTS {assembledCount(stage, percent / 100)}/{stage.parts.length}
        </p>
      </div>
    </section>
  )
}
```

- [ ] **Step 7: Create `app/events/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EventStage } from '@/components/event/EventStage'
import { RunSheet } from '@/components/event/RunSheet'
import { StatCounter } from '@/components/event/StatCounter'
import { TransitionLink } from '@/components/TransitionLink'
import { agency } from '@/content/agency'
import { shows } from '@/content/shows'

type Props = { params: Promise<{ slug: string }> }

export function formatShowDate(iso: string) {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso))
}

export function generateStaticParams() {
  return shows.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const show = shows.find((s) => s.slug === slug)
  if (!show) return {}
  return {
    title: `${show.name} — ${agency.name} (portfolio piece)`,
    description: `${show.type} in ${show.city} for ${show.capacity.toLocaleString('en-AU')} people. A fictional show by a fictional agency; portfolio piece by ${agency.credits.author}.`,
  }
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params
  const index = shows.findIndex((s) => s.slug === slug)
  if (index === -1) notFound()
  const show = shows[index]
  const next = shows[(index + 1) % shows.length]

  const facts: [string, string][] = [
    ['Date', formatShowDate(show.date)],
    ['Venue', show.venue],
    ['City', show.city],
    ['Capacity', show.capacity.toLocaleString('en-AU')],
    ['Type', show.type],
  ]

  return (
    <article>
      <header className="bg-stage px-5 pb-16 pt-24 md:px-10">
        <p className="label mb-6">
          {show.type} — {show.city}
        </p>
        <h1 className="font-display text-[clamp(3.5rem,12vw,13rem)] font-black uppercase leading-[0.85] tracking-tight">{show.name}</h1>
        <ul aria-label="Show facts" className="mt-12 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-5">
          {facts.map(([label, value]) => (
            <li key={label} className="bg-stage p-4">
              <p className="label">{label}</p>
              <p className="mt-2 font-mono text-sm uppercase text-ink">{value}</p>
            </li>
          ))}
        </ul>
      </header>

      <EventStage seed={show.seed} name={show.name} />

      {show.runSheet.length > 0 && <RunSheet items={show.runSheet} />}

      {show.stats.length > 0 && (
        <section aria-labelledby="stats-title" className="border-t border-line bg-stage px-5 py-24 md:px-10">
          <h2 id="stats-title" className="label mb-10">
            By the numbers
          </h2>
          <ul className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
            {show.stats.map((s) => (
              <li key={s.label} className="bg-stage p-6">
                <StatCounter value={s.value} unit={s.unit} />
                <p className="label mt-3">{s.label}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Next show" className="border-t border-line bg-stage px-5 py-24 md:px-10">
        <p className="label mb-6">Next show</p>
        <TransitionLink href={`/events/${next.slug}`} className="next-show block text-[clamp(2.5rem,9vw,9rem)] font-black uppercase leading-[0.85] tracking-tight">
          {next.name} →
        </TransitionLink>
      </nav>
    </article>
  )
}
```

- [ ] **Step 8: Styles — append to `app/globals.css`**

```css
.stat-value {
  display: flex;
  align-items: baseline;
  gap: 0.25em;
  font-size: clamp(2.5rem, 6vw, 5rem);
  font-weight: 900;
  line-height: 1;
}

.stat-unit {
  font-family: var(--font-mono);
  font-size: 0.3em;
  text-transform: uppercase;
  color: var(--color-mute);
}

.run-row[aria-current='step'] .run-cue {
  color: var(--color-led);
}

.next-show {
  font-stretch: 75%;
  transition: font-stretch 300ms var(--ease-mechanical), color 150ms var(--ease-mechanical);
}

.next-show:hover,
.next-show:focus-visible {
  font-stretch: 125%;
  color: var(--color-led);
}
```

- [ ] **Step 9: Checks** — `pnpm test && pnpm lint && pnpm typecheck && pnpm build` → all pass. In the build output, confirm five `/events/*` routes are prerendered. If Next 16 with `cacheComponents` rejects anything about this route (e.g. needs a `Suspense` boundary for `params`), make the smallest compliant change and record it.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(events): add event detail pages with their own stage, run sheet and numbers"
```

---

## Task 4: Work rows become links (hover and focus)

**Files:**
- Modify: `components/sections/WorkList.tsx`, `components/sections/WorkList.test.tsx`, `app/page.test.tsx` (router mock), `app/globals.css`

**Interfaces:**
- Consumes: `TransitionLink` (Task 2); event routes (Task 3).
- Produces: each row's name is a `TransitionLink` to `/events/{slug}` whose hit area covers the row; focusing the link lights the row and shows the preview at the row's right edge; blurring out of the list clears it.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/work-links
```

- [ ] **Step 2: Add failing tests to `components/sections/WorkList.test.tsx`**

Add at the top (after imports): `vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))` and import `vi` from vitest. Then:

```tsx
it('links every row to its event page', () => {
  render(<WorkList shows={shows} />)
  expect(screen.getByRole('link', { name: 'Night Signal' })).toHaveAttribute('href', '/events/night-signal')
  expect(screen.getAllByRole('link')).toHaveLength(shows.length)
})

it('lights the row when its link gets keyboard focus, and clears when focus leaves the list', () => {
  const { container } = render(<WorkList shows={shows} />)
  const link = screen.getByRole('link', { name: 'Low Frequency' })
  fireEvent.focusIn(link) // React 17+ listens on focusin/focusout
  const row = link.closest('li')!
  expect(row).toHaveAttribute('data-active', 'true')
  expect(container.querySelector('.work-preview svg')).not.toBeNull()
  fireEvent.focusOut(link, { relatedTarget: document.body })
  expect(row).toHaveAttribute('data-active', 'false')
})
```

Keep the existing "lists every show" test; its heading assertion `screen.getByRole('heading', { name: 'Night Signal' })` stays valid (the link sits inside the `h3`).

`app/page.test.tsx` now renders `TransitionLink` through `WorkList`, so add `vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))` there too.

- [ ] **Step 3: Run to verify they fail** — `pnpm test components/sections/WorkList.test.tsx` → FAIL.

- [ ] **Step 4: Change `components/sections/WorkList.tsx`**

- Import `TransitionLink` from `@/components/TransitionLink`.
- Add `relative` to each `li` className.
- Replace the `h3` content `{s.name}` with:
```tsx
<TransitionLink
  href={`/events/${s.slug}`}
  className="work-link"
  onFocus={(e) => {
    setActive(s.slug)
    placeAtRow(e.currentTarget.closest('li')!, e.currentTarget.closest('ol')!.parentElement!)
  }}
>
  {s.name}
</TransitionLink>
```
- Add next to `place`:
```tsx
  // Keyboard focus: park the preview at the row's right edge.
  const placeAtRow = (row: HTMLElement, container: HTMLElement) => {
    const el = preview.current
    if (!el) return
    const box = container.getBoundingClientRect()
    const r = row.getBoundingClientRect()
    const x = Math.max(0, box.width - el.offsetWidth)
    el.style.transform = `translate(${x}px, ${r.top - box.top + r.height / 2 - el.offsetHeight / 2}px)`
  }
```
- On the wrapper `div`, add `onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setActive(null) }}`.

- [ ] **Step 5: Stretched link — append to `app/globals.css`**

```css
.work-link::after {
  content: '';
  position: absolute;
  inset: 0;
}

.work-link:focus-visible {
  outline: none;
}

.work-row:has(.work-link:focus-visible) {
  outline: 2px solid var(--color-led);
  outline-offset: -2px;
}
```

- [ ] **Step 6: Checks** — `pnpm test && pnpm lint && pnpm typecheck && pnpm build` → all pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(home): link work rows to event pages and light rows on keyboard focus"
```

---

## Task 5: Preloader — "sound check"

**Files:**
- Create: `components/Preloader.tsx`, `components/Preloader.test.tsx`
- Modify: `app/layout.tsx`, `app/globals.css`

**Interfaces:**
- Consumes: `stageView` (`webglReady`), `canUseWebGL` (`webgl/support.ts`), `gsap`.
- Produces: `<Preloader />` (first visit per session only), `preloadPercent(elapsedMs: number, ready: boolean): number` — 0–100; time-based up to 1200 ms, capped at 90 until `ready`, forced to 100 at 3000 ms.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/preloader
```

- [ ] **Step 2: Write the failing test `components/Preloader.test.tsx`**

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetWebGLSupportCache } from '@/webgl/support'
import { Preloader, preloadPercent } from './Preloader'

vi.mock('@/lib/gsap')

describe('preloadPercent', () => {
  it('counts with time, waits at 90 until ready, never takes longer than 3 s', () => {
    expect(preloadPercent(0, false)).toBe(0)
    expect(preloadPercent(600, true)).toBe(50)
    expect(preloadPercent(1200, false)).toBe(90)
    expect(preloadPercent(1200, true)).toBe(100)
    expect(preloadPercent(3000, false)).toBe(100)
  })
})

describe('Preloader', () => {
  beforeEach(() => {
    // jsdom has no WebGL; stub so canUseWebGL() is quiet and false.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    resetWebGLSupportCache()
  })
  afterEach(() => {
    vi.restoreAllMocks()
    try {
      sessionStorage.clear()
    } catch {}
  })

  it('shows on the first visit of a session', () => {
    render(<Preloader />)
    expect(screen.getByRole('status')).toHaveTextContent(/sound check/i)
  })

  it('stays away when this session already saw it', async () => {
    sessionStorage.setItem('stage-console:preloaded', '1')
    render(<Preloader />)
    await waitFor(() => expect(screen.queryByRole('status')).toBeNull())
  })

  it('still works when storage is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => render(<Preloader />)).not.toThrow()
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: Run to verify it fails** — `pnpm test components/Preloader.test.tsx` → FAIL.

- [ ] **Step 4: Create `components/Preloader.tsx`**

```tsx
'use client'

import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { gsap } from '@/lib/gsap'
import { stageView } from '@/stage/view'
import { canUseWebGL } from '@/webgl/support'

const KEY = 'stage-console:preloaded'
const CHANNELS = 8

export function preloadPercent(elapsedMs: number, ready: boolean) {
  if (elapsedMs >= 3000) return 100
  const byTime = Math.min(1, elapsedMs / 1200)
  return Math.round(Math.min(byTime, ready ? 1 : 0.9) * 100)
}

function alreadySeen() {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(KEY, '1')
  } catch {}
}

/** First visit per session: a sound-check counter while fonts and the stage get ready. */
export function Preloader() {
  const [done, setDone] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const counter = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (alreadySeen()) {
      const t = window.setTimeout(() => setDone(true), 0)
      return () => window.clearTimeout(t)
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const webgl = canUseWebGL()
    let fontsReady = false
    void document.fonts?.ready.then(() => (fontsReady = true))
    const start = performance.now()
    let raf = 0
    let finished = false

    const finish = () => {
      finished = true
      markSeen()
      const el = root.current
      if (!el) return setDone(true)
      gsap.to(el, {
        yPercent: reduced ? 0 : -100,
        opacity: reduced ? 0 : 1,
        duration: reduced ? 0.2 : 0.7,
        ease: 'power3.inOut',
        onComplete: () => setDone(true),
      })
    }

    const tick = (now: number) => {
      const ready = fontsReady && (!webgl || stageView.get().webglReady)
      const pct = preloadPercent(now - start, ready)
      if (counter.current) counter.current.textContent = String(pct).padStart(3, '0')
      root.current?.style.setProperty('--lit', String(Math.floor((pct / 100) * CHANNELS)))
      if (pct >= 100 && !finished) return finish()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (done) return null

  return (
    <div ref={root} role="status" className="preloader">
      <p className="label">
        Sound check — CH 01…{String(CHANNELS).padStart(2, '0')}
      </p>
      <div className="preloader-leds" aria-hidden="true">
        {Array.from({ length: CHANNELS }, (_, i) => (
          <span key={i} style={{ '--i': i } as CSSProperties} />
        ))}
      </div>
      <p className="preloader-count" aria-hidden="true">
        <span ref={counter}>000</span>
      </p>
      <span className="sr-only">Loading the show</span>
    </div>
  )
}
```

- [ ] **Step 5: Mount + styles**

`app/layout.tsx`: import `Preloader` and render `<Preloader />` right before the `#shutter` div.

Append to `app/globals.css`:
```css
.preloader {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px 20px;
  background: var(--color-stage);
}

.preloader-leds {
  display: flex;
  gap: 10px;
}

.preloader-leds span {
  width: 10px;
  height: 10px;
  background: var(--color-led);
  /* channel i lights once --lit passes it */
  opacity: clamp(0.15, calc(var(--lit, 0) - var(--i)), 1);
}

.preloader-count {
  font-size: clamp(6rem, 30vw, 22rem);
  font-weight: 900;
  line-height: 0.8;
  font-variant-numeric: tabular-nums;
}
```

- [ ] **Step 6: Checks** — `pnpm test && pnpm lint && pnpm typecheck && pnpm build` → all pass. If react-hooks lint flags the `setDone` inside the effect, keep the `setTimeout` form shown (it is there for that reason) or make the smallest compliant change and record it.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(preloader): add a first-visit sound-check counter"
```

---

## Task 6: 404 — "No signal"

**Files:**
- Create: `app/not-found.tsx`, `app/not-found.test.tsx`, `components/NoiseCanvas.tsx`

**Interfaces:**
- Consumes: `TransitionLink` (Task 2).
- Produces: the App Router 404 page; `<NoiseCanvas />` (decorative, `aria-hidden`, animated static that draws once under reduced motion and does nothing without a 2D context).

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/not-found
```

- [ ] **Step 2: Write the failing test `app/not-found.test.tsx`**

```tsx
import { render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import NotFound from './not-found'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

it('says there is no signal and leads back to the stage', () => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null) // jsdom has no 2D canvas
  render(<NotFound />)
  expect(screen.getByRole('heading', { level: 1, name: 'No signal' })).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Return to stage' })).toHaveAttribute('href', '/')
})
```

- [ ] **Step 3: Run to verify it fails** — `pnpm test app/not-found.test.tsx` → FAIL.

- [ ] **Step 4: Create `components/NoiseCanvas.tsx`**

```tsx
'use client'

import { useEffect, useRef } from 'react'

/** TV static. Small canvas scaled up; ~12 fps; a single frame under reduced motion. */
export function NoiseCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const img = ctx.createImageData(canvas.width, canvas.height)
    const draw = () => {
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 60
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v
        img.data[i + 3] = 255
      }
      ctx.putImageData(img, 0, 0)
    }
    draw()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(draw, 80)
    return () => window.clearInterval(id)
  }, [])

  return <canvas ref={ref} width={160} height={90} aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full opacity-40 [image-rendering:pixelated]" />
}
```

- [ ] **Step 5: Create `app/not-found.tsx`**

```tsx
import { NoiseCanvas } from '@/components/NoiseCanvas'
import { TransitionLink } from '@/components/TransitionLink'

export default function NotFound() {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-var(--console-h))] flex-col justify-end bg-stage px-5 py-24 md:px-10">
      <NoiseCanvas />
      <p className="label mb-6">ERR 404 — input not found</p>
      <h1 className="font-display text-[clamp(4rem,16vw,16rem)] font-black uppercase leading-[0.85] tracking-tight">No signal</h1>
      <p className="mt-6 max-w-xl text-mute">This channel isn&apos;t patched to anything. Check the address, or head back to the stage.</p>
      <div className="mt-10">
        <TransitionLink href="/" className="book-button">
          Return to stage
        </TransitionLink>
      </div>
    </section>
  )
}
```

- [ ] **Step 6: Checks** — `pnpm test && pnpm lint && pnpm typecheck && pnpm build` → all pass (jsdom has no 2D context; `NoiseCanvas` must not throw — if jsdom prints a "not implemented: getContext" warning in the test output, stub `HTMLCanvasElement.prototype.getContext` to return `null` in that test file).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(404): add a no-signal page with animated static"
```

---

## Task 7: Phone console and phone menu

**Files:**
- Modify: `components/console/Console.tsx`, `components/console/console.css`, `components/console/Console.test.tsx`, `components/Header.tsx`, `app/globals.css`
- Create: `components/HeaderNav.tsx`, `components/HeaderNav.test.tsx`

**Interfaces:**
- Consumes: `CUES`, `cueLabel`, `useConsole` (activeCue), `TransitionLink`.
- Produces: Console gains a phone bar (current cue + "Console" toggle, `aria-expanded`, `aria-controls="console-panel"`); the groups live in `#console-panel`, collapsed under 768 px unless open; Escape closes. `<HeaderNav />` client component: desktop list unchanged; under 768 px a "Menu" toggle (`aria-expanded`) reveals the list.

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c feat/mobile-console
```

- [ ] **Step 2: Write the failing tests**

Add to `components/console/Console.test.tsx`:
```tsx
  it('has a phone toggle that opens and closes the panel (button and Escape)', () => {
    render(<Console />)
    const toggle = screen.getByRole('button', { name: 'Console' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAttribute('aria-controls', 'console-panel')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('region', { name: 'Show console' })).toHaveAttribute('data-open', 'true')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows the current cue on the phone bar', () => {
    render(<Console />)
    expect(screen.getByText('CUE 01 — Show')).toBeInTheDocument()
  })
```

`components/HeaderNav.test.tsx`:
```tsx
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { HeaderNav } from './HeaderNav'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

it('has a phone menu toggle that reveals the cue links', () => {
  render(<HeaderNav />)
  const toggle = screen.getByRole('button', { name: 'Menu' })
  expect(toggle).toHaveAttribute('aria-expanded', 'false')
  fireEvent.click(toggle)
  expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(screen.getByRole('link', { name: 'Work' })).toHaveAttribute('href', '/#cue-3')
})
```

- [ ] **Step 3: Run to verify they fail** — `pnpm test components/console components/HeaderNav.test.tsx` → FAIL.

- [ ] **Step 4: Console phone bar — `components/console/Console.tsx`**

- Add `useEffect`, `useState` imports and `cueLabel`, `CUES` (already imported), `useConsole`.
- Inside `Console`:
```tsx
  const [open, setOpen] = useState(false)
  const activeCue = useConsole((s) => s.activeCue)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
```
- Give the `<section>` `data-open={open}`, then wrap all existing `console-group` divs in `<div id="console-panel" className="console-panel">…</div>` and add before it:
```tsx
        <div className="console-bar">
          <span className="console-bar-cue">
            {cueLabel(activeCue)} — {CUES[activeCue - 1]?.label}
          </span>
          <button type="button" className="cue-button" aria-expanded={open} aria-controls="console-panel" onClick={() => setOpen((o) => !o)}>
            <span className="led" data-on={open} aria-hidden="true" />
            Console
          </button>
        </div>
```
  The visible label stays "Console" (so the accessible name matches what people see); `aria-expanded` and the LED carry the open state.

- [ ] **Step 5: Console phone styles — append to `components/console/console.css`**

```css
.console-bar {
  display: none;
}

.console-panel {
  display: flex;
  align-items: stretch;
}

@media (max-width: 767px) {
  :root {
    --console-h: 56px;
  }

  .console {
    flex-direction: column;
    height: auto;
    max-height: 70vh;
    overflow: visible;
  }

  .console-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    height: 56px;
    padding: 0 16px;
  }

  .console-panel {
    display: none;
    flex-wrap: wrap;
    overflow-y: auto;
    border-top: 1px solid var(--color-line);
  }

  .console[data-open='true'] .console-panel {
    display: flex;
  }

  .console-group {
    flex: 1 1 100%;
    flex-wrap: wrap;
    border-right: none;
    border-bottom: 1px solid var(--color-line);
  }

  .fader input[type='range'] {
    writing-mode: horizontal-tb;
    direction: ltr;
    width: 100%;
    height: 20px;
    background: linear-gradient(#050505, #050505) center / 100% 4px no-repeat;
  }

  .fader {
    flex: 1 1 30%;
  }
}
```

(The `:root { --console-h }` override shrinks the body padding reserved for the console on phones.)

- [ ] **Step 6: Create `components/HeaderNav.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { TransitionLink } from '@/components/TransitionLink'
import { CUES } from '@/content/cues'

export function HeaderNav() {
  const [open, setOpen] = useState(false)
  return (
    <nav aria-label="Main" className="header-nav">
      <button type="button" className="header-menu label md:hidden" aria-expanded={open} aria-controls="main-nav-list" onClick={() => setOpen((o) => !o)}>
        Menu
      </button>
      <ul id="main-nav-list" data-open={open} className="label header-nav-list">
        {CUES.map((c) => (
          <li key={c.n}>
            <TransitionLink href={`/#cue-${c.n}`} className="hover:text-ink" onClick={() => setOpen(false)}>
              {c.label}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
```

`components/Header.tsx`: replace the `<nav>…</nav>` block with `<HeaderNav />` (import it); keep the logo `TransitionLink` and `SoundToggle`.

Append to `app/globals.css`:
```css
.header-nav-list {
  display: flex;
  gap: 16px;
}

@media (max-width: 767px) {
  .header-nav {
    position: relative;
  }

  .header-nav-list {
    display: none;
    position: absolute;
    right: 0;
    top: calc(100% + 12px);
    flex-direction: column;
    gap: 0;
    min-width: 180px;
    border: 1px solid var(--color-line);
    background: var(--color-panel);
  }

  .header-nav-list[data-open='true'] {
    display: flex;
  }

  .header-nav-list a {
    display: block;
    padding: 12px 16px;
  }
}
```

- [ ] **Step 7: Checks** — `pnpm test && pnpm lint && pnpm typecheck && pnpm build` → all pass (the existing Console tests — region, 5 cues, 5 sliders — must still pass).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(mobile): collapsible console bar and a phone menu"
```

---

## Task 8: Cleanup and final README

**Files:**
- Modify: `app/globals.css` (remove the duplicate `.led` block added in Stage 2 — `console.css` is loaded globally from the root layout and owns `.led`), `README.md`

- [ ] **Step 1: Branch**

```bash
git switch main && git pull --ff-only && git switch -c docs/readme
```

- [ ] **Step 2: Remove the duplicate `.led` rules from `app/globals.css`** (the block commented "Shared LED (also defined in console.css …)"). Run `pnpm test && pnpm build`.

- [ ] **Step 3: Replace `README.md`**

```markdown
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
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: final README and remove duplicate LED styles"
```

---

## Stage 3 checkpoint (controller + PM)

Controller (before tagging):
- [ ] CDP script (`scratchpad/cdp-check.mjs`, extend as needed) on the production build (`pnpm build && pnpm start`): desktop 1440×900, phone 390×844 — home and `/events/night-signal` — each with (a) default, (b) reduced motion, (c) WebGL disabled; no page errors, no horizontal overflow, stage visible, HUD reaches 100%.
- [ ] Navigate home → event → back: canvas shows the right seed, no stale progress, shutter opens.
- [ ] `/nope` shows "No signal".
- [ ] Lighthouse (desktop) on the production build: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95; first-load JS for `/` ≤ ~250 KB gzip.
- [ ] Tag `v0.1.0` and publish GitHub release notes (spec §16).

PM:
- [ ] Connect Vercel (if not done) and put the production URL in the CV.
- [ ] Decide gallery image source; agency name; LinkedIn URL.
- [ ] Safari probe for #14.
