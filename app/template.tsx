'use client'

import { type ReactNode, useEffect } from 'react'
import { ScrollTrigger } from '@/lib/gsap'
import { getLenis } from '@/lib/scroll'
import { openShutter } from '@/lib/transition'

/** Runs on every navigation: start at the top, re-measure scroll triggers, lift the shutter. */
export default function Template({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.location.hash === '') {
      getLenis()?.scrollTo(0, { immediate: true })
      window.scrollTo(0, 0)
    }
    ScrollTrigger.refresh()
    openShutter()
  }, [])
  return children
}
