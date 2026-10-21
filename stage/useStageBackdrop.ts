'use client'

import { type RefObject, useEffect } from 'react'
import { showStageFor } from './view'

/** Keeps the stage canvas running behind a section whose background is see-through. */
export function useStageBackdrop(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const node = ref.current?.closest('section') ?? ref.current
    if (!node || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([entry]) => showStageFor(node, entry.isIntersecting))
    io.observe(node)
    return () => {
      io.disconnect()
      showStageFor(node, false)
    }
  }, [ref])
}
