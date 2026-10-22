'use client'

import { Canvas } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { stageView, useStageView } from '@/stage/view'
import { StageScene } from './StageScene'

export function StageCanvas() {
  const visible = useStageView((s) => s.visible)
  const [lite] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const offContextEvents = useRef<() => void>(undefined)
  useEffect(() => () => offContextEvents.current?.(), [])

  return (
    <Canvas
      dpr={lite ? [1, 1.5] : [1, 2]}
      eventSource={document.body}
      eventPrefix="client"
      frameloop={visible ? 'always' : 'never'}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 35, position: [0, 7, 30], near: 0.1, far: 200 }}
      onCreated={({ gl }) => {
        stageView.set({ webglReady: true })
        // A lost GPU context leaves a black canvas: show the drawing until the browser restores it.
        const el = gl.domElement
        const lost = (e: Event) => {
          e.preventDefault() // lets the browser try to restore the context
          stageView.set({ webglReady: false })
        }
        const restored = () => stageView.set({ webglReady: true })
        el.addEventListener('webglcontextlost', lost)
        el.addEventListener('webglcontextrestored', restored)
        offContextEvents.current = () => {
          el.removeEventListener('webglcontextlost', lost)
          el.removeEventListener('webglcontextrestored', restored)
        }
      }}
    >
      <StageScene />
    </Canvas>
  )
}
