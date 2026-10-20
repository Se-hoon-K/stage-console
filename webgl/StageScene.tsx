'use client'

import { useFrame } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import type { BloomEffect } from 'postprocessing'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { onPadHit } from '@/console/padEvents'
import { consoleStore } from '@/console/store'
import { lightsOn, partOffset } from '@/stage/assembly'
import { generateStage, type Part } from '@/stage/generateStage'
import { lightLevel } from '@/stage/lighting'
import { stageView, useStageView } from '@/stage/view'
import { createBeamMaterial } from './beamMaterial'

type BodyKind = 'deck' | 'truss' | 'speaker' | 'screen'
const BODY_KINDS: BodyKind[] = ['deck', 'truss', 'speaker', 'screen']
const BODY_COLORS: Record<BodyKind, string> = { deck: '#262626', truss: '#1c1c1c', speaker: '#111111', screen: '#0a0a0a' }
const BEAM_MIN_HEIGHT = 3

// Scratch objects reused every frame (no per-frame allocation).
const obj = new THREE.Object3D()
const col = new THREE.Color()
const hueCol = new THREE.Color()
const camTarget = new THREE.Vector3()
// Pad flash, 1 on hit, decays to 0. One scene at a time, so module scope is fine.
const flash = { value: 0 }

function placePart(p: Part, progress: number) {
  const f = partOffset(progress, p.order)
  obj.position.set(p.position[0] + p.exploded[0] * f, p.position[1] + p.exploded[1] * f, p.position[2] + p.exploded[2] * f)
  obj.rotation.set(p.rotation[0], p.rotation[1], p.rotation[2])
}

function Bodies({ kind, parts }: { kind: BodyKind; parts: Part[] }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useFrame(() => {
    const mesh = ref.current
    if (!mesh) return
    const { progress } = stageView.get()
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]
      placePart(p, progress)
      obj.scale.set(p.size[0], p.size[1], p.size[2])
      obj.updateMatrix()
      mesh.setMatrixAt(i, obj.matrix)
    }
    mesh.instanceMatrix.needsUpdate = true
  })
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, parts.length]} frustumCulled={false}>
      <boxGeometry />
      <meshStandardMaterial color={BODY_COLORS[kind]} roughness={0.6} metalness={0.4} />
    </instancedMesh>
  )
}

function Rig({ lights }: { lights: Part[] }) {
  const lensRef = useRef<THREE.InstancedMesh>(null)
  const beamRef = useRef<THREE.InstancedMesh>(null)
  const washRef = useRef<THREE.PointLight>(null)

  const beamGeometry = useMemo(() => {
    const g = new THREE.ConeGeometry(0.3, 1, 32, 1, true)
    g.translate(0, -0.5, 0) // apex at the fixture, base 1 unit below
    g.setAttribute('aLevel', new THREE.InstancedBufferAttribute(new Float32Array(lights.length), 1))
    return g
  }, [lights.length])
  const beamMaterial = useMemo(() => createBeamMaterial(), [])
  useEffect(
    () => () => {
      beamGeometry.dispose()
      beamMaterial.dispose()
    },
    [beamGeometry, beamMaterial],
  )

  // instanceColor must exist before the first render so the lens material compiles with it.
  useLayoutEffect(() => {
    const lens = lensRef.current
    if (!lens) return
    for (let i = 0; i < lights.length; i++) lens.setColorAt(i, col.setRGB(0, 0, 0))
    if (lens.instanceColor) lens.instanceColor.needsUpdate = true
  }, [lights.length])

  useFrame((state) => {
    const lens = lensRef.current
    const beams = beamRef.current
    if (!lens || !beams) return
    const { progress } = stageView.get()
    const c = consoleStore.get()
    const time = state.clock.elapsedTime
    hueCol.setHSL(c.hue / 360, 1, 0.55)
    // Read material/geometry back off the mesh so the compiler sees no mutation of memoised values.
    const mat = beams.material as THREE.ShaderMaterial
    mat.uniforms.uColor.value.copy(hueCol)
    mat.uniforms.uTime.value = time
    const levels = beams.geometry.getAttribute('aLevel') as THREE.InstancedBufferAttribute

    let sum = 0
    for (let i = 0; i < lights.length; i++) {
      const p = lights[i]
      const on = lightsOn(progress, i, lights.length)
      const level =
        lightLevel({ progress, index: i, count: lights.length, time, tempo: c.tempo }) * c.master * c.intensity +
        flash.value * on
      levels.setX(i, level)
      sum += level

      placePart(p, progress)
      obj.scale.setScalar(1)
      obj.updateMatrix()
      lens.setMatrixAt(i, obj.matrix)
      lens.setColorAt(i, col.copy(hueCol).multiplyScalar(0.15 + level * 2.5))

      const hung = p.position[1] > BEAM_MIN_HEIGHT
      const h = hung ? obj.position.y : 0
      obj.rotation.set(0, 0, hung ? Math.sin(time * 0.6 + i) * 0.25 : 0)
      obj.scale.set(h, h, h)
      obj.updateMatrix()
      beams.setMatrixAt(i, obj.matrix)
    }

    levels.needsUpdate = true
    lens.instanceMatrix.needsUpdate = true
    if (lens.instanceColor) lens.instanceColor.needsUpdate = true
    beams.instanceMatrix.needsUpdate = true
    if (washRef.current) {
      washRef.current.color.copy(hueCol)
      washRef.current.intensity = (sum / Math.max(1, lights.length)) * 40
    }
  })

  return (
    <>
      <instancedMesh ref={lensRef} args={[undefined, undefined, lights.length]} frustumCulled={false}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={beamRef} args={[beamGeometry, beamMaterial, lights.length]} frustumCulled={false} />
      <pointLight ref={washRef} position={[0, 6, 2]} distance={30} decay={1.5} intensity={0} />
    </>
  )
}

export function StageScene() {
  const seed = useStageView((s) => s.seed)
  const stage = useMemo(() => generateStage(seed), [seed])
  const groups = useMemo(() => {
    const by = (k: Part['kind']) => stage.parts.filter((p) => p.kind === k)
    return { deck: by('deck'), truss: by('truss'), speaker: by('speaker'), screen: by('screen'), light: by('light') }
  }, [stage])
  const fogRef = useRef<THREE.FogExp2>(null)
  const bloomRef = useRef<BloomEffect>(null)
  const [lite] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [reduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(
    () =>
      onPadHit(() => {
        flash.value = 1
      }),
    [],
  )

  useFrame((state, dt) => {
    flash.value = Math.max(0, flash.value - dt * 4)
    const c = consoleStore.get()
    const { progress } = stageView.get()
    if (fogRef.current) fogRef.current.density = 0.006 + c.fog * 0.035

    const p = Math.min(progress / 0.8, 1)
    const live = progress >= 1 && !reduced
    camTarget.set(live ? state.pointer.x * 0.8 : 0, 7 - 2.5 * p + (live ? state.pointer.y * 0.4 : 0), 30 - 11 * p)
    state.camera.position.lerp(camTarget, reduced ? 1 : 0.08)
    state.camera.lookAt(0, 3, 0)

    if (bloomRef.current) bloomRef.current.intensity = 0.6 + flash.value * 1.4
  })

  return (
    <>
      <color attach="background" args={['#0e0e0e']} />
      <fogExp2 ref={fogRef} attach="fog" args={['#0e0e0e', 0.02]} />
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 12, 10]} intensity={0.8} />
      <group key={seed}>
        {BODY_KINDS.map((k) => groups[k].length > 0 && <Bodies key={k} kind={k} parts={groups[k]} />)}
        <Rig lights={groups.light} />
      </group>
      {!lite && (
        <EffectComposer multisampling={0}>
          <Bloom ref={bloomRef} mipmapBlur luminanceThreshold={0.4} intensity={0.6} />
        </EffectComposer>
      )}
    </>
  )
}
