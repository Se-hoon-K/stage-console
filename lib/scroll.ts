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
