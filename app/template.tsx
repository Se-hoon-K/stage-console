'use client'

import { usePathname } from 'next/navigation'
import { type ReactNode, useEffect } from 'react'
import { ScrollTrigger } from '@/lib/gsap'
import { getLenis } from '@/lib/scroll'
import { openShutter } from '@/lib/transition'

let mounted = false

/** Runs on every navigation: start at the top, re-measure scroll triggers, lift the shutter, move focus to the page heading. */
export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  useEffect(() => {
    const hash = window.location.hash !== ''
    if (!hash) {
      getLenis()?.scrollTo(0, { immediate: true })
      window.scrollTo(0, 0)
    }
    ScrollTrigger.refresh()
    openShutter()
    // Skip the initial page load; the hash target handles focus when there is one.
    if (mounted && !hash) document.querySelector<HTMLElement>('main h1')?.focus({ preventScroll: true })
    mounted = true
  }, [pathname])
  return children
}
