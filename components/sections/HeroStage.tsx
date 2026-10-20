'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useConsole } from '@/console/store'
import { agency } from '@/content/agency'
import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap'
import { assembledCount } from '@/stage/assembly'
import { generateStage } from '@/stage/generateStage'
import { StageSvg } from '@/stage/StageSvg'
import { stageView, useStageView } from '@/stage/view'

export function HeroStage() {
  const ref = useRef<HTMLDivElement>(null)
  const stage = useMemo(() => generateStage(agency.heroSeed), [])
  const hue = useConsole((s) => s.hue)
  const webglReady = useStageView((s) => s.webglReady)
  const percent = useStageView((s) => Math.round(s.progress * 100))

  useEffect(() => {
    const section = ref.current?.closest('section')
    if (!section) return
    stageView.set({ seed: agency.heroSeed })

    let io: IntersectionObserver | undefined
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(([entry]) => stageView.set({ visible: entry.isIntersecting }))
      io.observe(section)
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      stageView.set({ progress: 1 })
      return () => {
        io?.disconnect()
        stageView.set({ visible: false })
      }
    }

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=150%',
        pin: true,
        scrub: true,
        onUpdate: (self) => stageView.set({ progress: self.progress }),
      })
      stageView.set({ progress: trigger.progress })
      const title = section.querySelector('h1')
      if (title) {
        const split = SplitText.create(title, { type: 'lines,chars', mask: 'lines' })
        gsap.from(split.chars, { yPercent: 110, duration: 0.9, ease: 'power4.out', stagger: 0.02 })
      }
    }, section)

    return () => {
      ctx.revert()
      io?.disconnect()
      stageView.set({ visible: false })
    }
  }, [])

  const built = assembledCount(stage, percent / 100)

  return (
    <div ref={ref} className="pointer-events-none absolute inset-0 -z-10">
      <StageSvg
        stage={stage}
        hue={hue}
        className={`absolute inset-x-0 top-[14%] mx-auto h-[55%] w-full transition-opacity duration-700 ${webglReady ? 'opacity-0' : 'opacity-100'}`}
      />
      <p className="sr-only">
        An illustrated concert stage — truss towers, a lighting rig and speaker stacks — assembles as you scroll. Its
        lights follow the show console.
      </p>
      <div className="label absolute right-5 top-6 space-y-1 text-right md:right-10" aria-hidden="true">
        <p>ASSEMBLY {String(percent).padStart(3, '0')}%</p>
        <p>
          PARTS {built}/{stage.parts.length}
        </p>
      </div>
    </div>
  )
}
