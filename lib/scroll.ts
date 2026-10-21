import type Lenis from 'lenis'

let lenis: Lenis | null = null
let gliding = false
let safety: number | undefined

export function setLenis(instance: Lenis | null) {
  lenis = instance
  endGlide()
}

/** True while a cue-triggered scroll is still travelling. */
export const isGliding = () => gliding

export const getLenis = () => lenis

function endGlide() {
  gliding = false
  window.clearTimeout(safety)
  window.removeEventListener('scrollend', endGlide)
}

function startGlide() {
  window.removeEventListener('scrollend', endGlide)
  gliding = true
  window.clearTimeout(safety)
  safety = window.setTimeout(endGlide, 1600)
}

export function scrollToCue(n: number): boolean {
  const el = document.getElementById(`cue-${n}`)
  if (!el) return false
  // The pinned hero section is position: fixed, so scrolling to it is a no-op; go to the top instead.
  const top = n === 1

  if (lenis) {
    startGlide()
    lenis.scrollTo(top ? 0 : el, { duration: 1.2, onComplete: endGlide })
  } else if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    endGlide()
    if (top) window.scrollTo({ top: 0, behavior: 'auto' })
    else el.scrollIntoView({ behavior: 'auto' })
  } else {
    startGlide()
    window.addEventListener('scrollend', endGlide, { once: true })
    if (top) window.scrollTo({ top: 0, behavior: 'smooth' })
    else el.scrollIntoView({ behavior: 'smooth' })
  }
  el.focus({ preventScroll: true })
  return true
}
