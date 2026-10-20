'use client'

import { type PointerEvent, useMemo, useRef, useState } from 'react'
import { useConsole } from '@/console/store'
import type { Show } from '@/content/shows'
import { generateStage } from '@/stage/generateStage'
import { StageSvg } from '@/stage/StageSvg'

export function WorkList({ shows }: { shows: Show[] }) {
  const [active, setActive] = useState<string | null>(null)
  const preview = useRef<HTMLDivElement>(null)
  const hue = useConsole((s) => s.hue)
  const stages = useMemo(() => new Map(shows.map((s) => [s.slug, generateStage(s.seed)])), [shows])
  const activeStage = active ? stages.get(active) : undefined

  // Ref write (no re-render); keeps the preview inside the container's right edge.
  const place = (e: PointerEvent<HTMLElement>, container: HTMLElement) => {
    const el = preview.current
    if (!el) return
    const box = container.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - box.left + 24, box.width - el.offsetWidth))
    el.style.transform = `translate(${x}px, ${e.clientY - box.top - 80}px)`
  }

  return (
    <div
      className="relative mt-12"
      onPointerMove={(e) => place(e, e.currentTarget)}
      onPointerLeave={() => setActive(null)}
    >
      <ol className="border-t border-line">
        {shows.map((s, i) => (
          <li
            key={s.slug}
            data-active={active === s.slug}
            onPointerEnter={(e) => {
              setActive(s.slug)
              place(e, e.currentTarget.closest('ol')!.parentElement!)
            }}
            className="work-row grid grid-cols-[3rem_1fr] items-baseline gap-x-4 gap-y-1 border-b border-line py-5 md:grid-cols-[4rem_minmax(0,2fr)_1fr_5rem_7rem_8rem]"
          >
            <span className="label">
              <span className="led" data-on={active === s.slug} aria-hidden="true" />
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3 className="work-name text-[clamp(1.5rem,4vw,3.5rem)] font-extrabold uppercase leading-none">{s.name}</h3>
            <span className="label col-start-2 md:col-start-auto">{s.city}</span>
            <span className="label col-start-2 md:col-start-auto">{s.date.slice(0, 4)}</span>
            <span className="label col-start-2 md:col-start-auto">{s.type}</span>
            <span className="label col-start-2 md:col-start-auto">{s.capacity.toLocaleString('en-AU')} cap.</span>
          </li>
        ))}
      </ol>
      <div
        ref={preview}
        aria-hidden="true"
        data-visible={activeStage !== undefined}
        className="work-preview pointer-events-none absolute left-0 top-0 hidden h-40 w-64 border border-line bg-panel p-3 md:block"
      >
        {activeStage && <StageSvg stage={activeStage} hue={hue} className="h-full w-full" />}
      </div>
    </div>
  )
}
