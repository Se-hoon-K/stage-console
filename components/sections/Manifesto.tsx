'use client'

import { useEffect, useRef } from 'react'
import { gsap, SplitText } from '@/lib/gsap'

/** Words fill in from outline as the section scrolls through, like lights being raised. */
export function Manifesto({ lines }: { lines: string[] }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const ctx = gsap.context(() => {
      const split = SplitText.create(el.querySelectorAll('p'), { type: 'words' })
      gsap.fromTo(
        split.words,
        { color: 'rgba(237, 235, 230, 0)' },
        {
          color: 'rgba(237, 235, 230, 1)',
          ease: 'none',
          stagger: 0.05,
          scrollTrigger: { trigger: el, start: 'top 75%', end: 'bottom 45%', scrub: true },
        },
      )
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={ref} className="manifesto mt-12 max-w-5xl space-y-2">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  )
}
