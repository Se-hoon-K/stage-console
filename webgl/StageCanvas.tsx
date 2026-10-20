'use client'

import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { stageView, useStageView } from '@/stage/view'
import { StageScene } from './StageScene'

export function StageCanvas() {
  const visible = useStageView((s) => s.visible)
  const [lite] = useState(() => window.matchMedia('(max-width: 767px)').matches)

  return (
    <Canvas
      dpr={lite ? [1, 1.5] : [1, 2]}
      eventSource={document.body}
      eventPrefix="client"
      frameloop={visible ? 'always' : 'never'}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 35, position: [0, 7, 30], near: 0.1, far: 200 }}
      onCreated={() => stageView.set({ webglReady: true })}
    >
      <StageScene />
    </Canvas>
  )
}
