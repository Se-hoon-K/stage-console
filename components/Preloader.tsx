'use client'

import { type CSSProperties, useEffect, useRef, useState } from 'react'
import { gsap } from '@/lib/gsap'
import { PRELOADED_KEY } from '@/lib/preloaderKey'

const CHANNELS = 8

export function preloadPercent(elapsedMs: number, ready: boolean) {
  if (elapsedMs >= 3000) return 100
  const byTime = Math.min(1, elapsedMs / 1200)
  return Math.round(Math.min(byTime, ready ? 1 : 0.9) * 100)
}

function alreadySeen() {
  try {
    return sessionStorage.getItem(PRELOADED_KEY) === '1'
  } catch {
    return false
  }
}

function markSeen() {
  try {
    sessionStorage.setItem(PRELOADED_KEY, '1')
  } catch {}
}

/** First visit per session: a sound-check counter while the fonts load. */
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
    let fontsReady = !document.fonts
    void document.fonts?.ready.then(() => (fontsReady = true))
    const start = performance.now()
    let raf = 0
    let fallback = 0
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
      // Never trap the visitor: a throttled tab may never complete the tween.
      fallback = window.setTimeout(() => setDone(true), 1500)
    }

    if (reduced) {
      // No counting: show the full state and fade out as soon as the fonts are ready (or at the 3 s cap).
      if (counter.current) counter.current.textContent = '100'
      root.current?.style.setProperty('--lit', String(CHANNELS))
      const poll = window.setInterval(() => {
        if (fontsReady) {
          window.clearInterval(poll)
          finish()
        }
      }, 50)
      const cap = window.setTimeout(() => {
        window.clearInterval(poll)
        if (!finished) finish()
      }, 3000)
      return () => {
        window.clearInterval(poll)
        window.clearTimeout(cap)
        window.clearTimeout(fallback)
      }
    }

    const tick = (now: number) => {
      // Fonts only: the WebGL stage mounts after load/idle (webgl/Scene) behind its SVG fallback.
      const pct = preloadPercent(now - start, fontsReady)
      if (counter.current) counter.current.textContent = String(pct).padStart(3, '0')
      root.current?.style.setProperty('--lit', String(Math.floor((pct / 100) * CHANNELS)))
      if (pct >= 100 && !finished) return finish()
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(fallback)
    }
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
