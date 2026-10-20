'use client'

import dynamic from 'next/dynamic'
import { useSyncExternalStore } from 'react'
import { canUseWebGL } from './support'
import { WebGLBoundary } from './WebGLBoundary'

const StageCanvas = dynamic(() => import('./StageCanvas').then((m) => m.StageCanvas), { ssr: false })

const noSubscribe = () => () => {}

/** Persistent WebGL layer behind <main>. Decorative: the hero carries a text description. */
export function Scene() {
  // false on the server and during hydration, then the real answer on the client.
  const supported = useSyncExternalStore(noSubscribe, canUseWebGL, () => false)
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      {supported && (
        <WebGLBoundary>
          <StageCanvas />
        </WebGLBoundary>
      )}
    </div>
  )
}
