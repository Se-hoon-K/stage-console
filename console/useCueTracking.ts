'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'
import { consoleStore } from './store'

/** Lights the cue whose section crosses the middle of the viewport. */
export function useCueTracking() {
  const pathname = usePathname()

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return
    const sections = document.querySelectorAll<HTMLElement>('[data-cue]')
    if (sections.length === 0) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) consoleStore.setValue('activeCue', Number(entry.target.getAttribute('data-cue')))
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [pathname])
}
