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
