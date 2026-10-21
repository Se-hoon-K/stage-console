'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { canUseWebGL } from './support'
import { WebGLBoundary } from './WebGLBoundary'

const StageCanvas = dynamic(() => import('./StageCanvas').then((m) => m.StageCanvas), { ssr: false })

const noSubscribe = () => () => {}

const INTERACTIONS = ['scroll', 'wheel', 'pointerdown', 'keydown', 'touchstart'] as const

/**
 * Calls `fn` (in an idle callback) on the visitor's first interaction, or `fallbackMs` after load,
 * whichever comes first. Keeps the WebGL scene build and shader compile out of hydration and the
 * load window; the SVG stage covers until then.
 */
export function whenStageCanMount(fn: () => void, fallbackMs = 4000) {
  let idle = 0
  let timer = 0
  let fired = false
  const go = () => {
    if (fired) return
    fired = true
    cleanup()
    if (window.requestIdleCallback) idle = window.requestIdleCallback(fn, { timeout: 500 })
    else timer = window.setTimeout(fn, 0)
  }
  const arm = () => (timer = window.setTimeout(go, fallbackMs))
  const cleanup = () => {
    window.removeEventListener('load', arm)
    for (const e of INTERACTIONS) window.removeEventListener(e, go)
    window.clearTimeout(timer)
  }
  for (const e of INTERACTIONS) window.addEventListener(e, go, { once: true, passive: true })
  if (document.readyState === 'complete') arm()
  else window.addEventListener('load', arm, { once: true })
  return () => {
    cleanup()
    if (idle) window.cancelIdleCallback(idle)
    window.clearTimeout(timer)
  }
}

/** Persistent WebGL layer behind <main>. Decorative: the hero carries a text description. */
export function Scene() {
  // false on the server and during hydration, then the real answer on the client.
  const supported = useSyncExternalStore(noSubscribe, canUseWebGL, () => false)
  // The SVG stage shows until the canvas reports webglReady.
  const [deferred, setDeferred] = useState(false)
  useEffect(() => (supported ? whenStageCanMount(() => setDeferred(true)) : undefined), [supported])
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0">
      {supported && deferred && (
        <WebGLBoundary>
          <StageCanvas />
        </WebGLBoundary>
      )}
    </div>
  )
}
