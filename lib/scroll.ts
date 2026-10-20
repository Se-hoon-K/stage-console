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
