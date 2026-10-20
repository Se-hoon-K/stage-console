'use client'

import dynamic from 'next/dynamic'

const StageCanvas = dynamic(() => import('./StageCanvas').then((m) => m.StageCanvas), { ssr: false })

/** Persistent WebGL layer behind <main>. Decorative: the hero carries a text description. */
export function Scene() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      <StageCanvas />
    </div>
  )
}
