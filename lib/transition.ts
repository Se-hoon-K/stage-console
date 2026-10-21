import { gsap } from '@/lib/gsap'

let closed = false
let guard = 0
const shutter = () => document.getElementById('shutter')
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** True from closeShutter until openShutter. */
export const isTransitioning = () => closed

/** Blackout: the shutter drops over the page. Resolves when the screen is covered. */
export function closeShutter(): Promise<void> {
  const el = shutter()
  if (!el || reduced()) return Promise.resolve()
  closed = true
  // A navigation that never lands (same-route remount, error) must not leave the screen covered.
  window.clearTimeout(guard)
  guard = window.setTimeout(openShutter, 4000)
  return new Promise((resolve) => {
    // Hidden tabs pause rAF so onComplete may never fire; the timeout keeps navigation alive.
    const timer = window.setTimeout(resolve, 800)
    const done = () => {
      window.clearTimeout(timer)
      resolve()
    }
    gsap.fromTo(
      el,
      { scaleY: 0, transformOrigin: '50% 100%' },
      { scaleY: 1, duration: 0.45, ease: 'power3.in', onComplete: done },
    )
  })
}

/** Lights up: the shutter lifts off the new page. No-op unless closeShutter ran. */
export function openShutter() {
  const el = shutter()
  window.clearTimeout(guard)
  if (!el || !closed) return
  closed = false
  gsap.fromTo(el, { scaleY: 1, transformOrigin: '50% 0%' }, { scaleY: 0, duration: 0.6, ease: 'power3.out', delay: 0.05 })
}
