'use client'

import { type RefObject, useLayoutEffect } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { stageView } from './view'

type Options = { seed: number; end?: string }

/** Binds a section to the persistent stage canvas: seed, visibility and scroll-driven assembly. */
export function useStageSection(ref: RefObject<HTMLElement | null>, { seed, end = '+=150%' }: Options) {
  useLayoutEffect(() => {
    const node = ref.current
    const section = node?.closest('section') ?? node
    if (!section) return
    stageView.set({ seed })

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

    const apply = (progress: number) => {
      stageView.set({ progress })
      section.style.setProperty('--assembly', String(progress))
    }
    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end,
        pin: true,
        scrub: true,
        onUpdate: (self) => apply(self.progress),
      })
      apply(trigger.progress)
    }, section)

    return () => {
      ctx.revert()
      io?.disconnect()
      stageView.set({ visible: false })
    }
  }, [ref, seed, end])
}
