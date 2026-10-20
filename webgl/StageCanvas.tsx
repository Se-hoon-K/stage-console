'use client'

import { Canvas } from '@react-three/fiber'
import { useState } from 'react'
import { stageView, useStageView } from '@/stage/view'
import { StageScene } from './StageScene'
import { canUseWebGL } from './support'

export function StageCanvas() {
  const visible = useStageView((s) => s.visible)
  const [supported] = useState(() => canUseWebGL())
  if (!supported) return null

  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={visible ? 'always' : 'never'}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ fov: 35, position: [0, 7, 30], near: 0.1, far: 200 }}
      onCreated={() => stageView.set({ webglReady: true })}
    >
      <StageScene />
    </Canvas>
  )
}
