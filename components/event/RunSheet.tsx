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
      <ol ref={list} aria-labelledby="run-sheet-title" className="border-t border-line">
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
