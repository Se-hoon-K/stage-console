'use client'

import { useMemo, useRef } from 'react'
import { useConsole } from '@/console/store'
import { assembledCount, stagePhase } from '@/stage/assembly'
import { generateStage } from '@/stage/generateStage'
import { StageSvg } from '@/stage/StageSvg'
import { useStageSection } from '@/stage/useStageSection'
import { useStageView } from '@/stage/view'

/** Pinned, transparent section that shows this show's own stage on the shared canvas. */
export function EventStage({ seed, name }: { seed: number; name: string }) {
  const ref = useRef<HTMLElement>(null)
  useStageSection(ref, { seed })
  const stage = useMemo(() => generateStage(seed), [seed])
  const hue = useConsole((s) => s.hue)
  const webglReady = useStageView((s) => s.webglReady)
  const percent = useStageView((s) => Math.round(s.progress * 100))

  return (
    <div data-pin-spacer>
    <section ref={ref} aria-label={`${name} stage`} className="relative isolate h-[calc(100svh-var(--console-h))]">
      <StageSvg
        draw
        stage={stage}
        hue={hue}
        className={`absolute inset-x-0 top-[12%] mx-auto h-[60%] w-full transition-opacity duration-700 ${webglReady ? 'opacity-0' : 'opacity-100'}`}
      />
      <p className="sr-only">The stage built for {name} assembles as you scroll.</p>
      <div className="label absolute right-5 top-6 space-y-1 text-right md:right-10" aria-hidden="true">
        <p>
          {stagePhase(percent / 100)} {String(percent).padStart(3, '0')}%
        </p>
        <p>
          PARTS {assembledCount(stage, percent / 100)}/{stage.parts.length}
        </p>
      </div>
    </section>
    </div>
  )
}
