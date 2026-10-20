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
