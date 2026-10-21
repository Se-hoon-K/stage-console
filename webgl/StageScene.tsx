'use client'

import { useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import type { BloomEffect } from 'postprocessing'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { onPadHit } from '@/console/padEvents'
import { consoleStore } from '@/console/store'
import { ASSEMBLY_END, lightsOn, partOffset, showProgress } from '@/stage/assembly'
import { generateStage, type Part } from '@/stage/generateStage'
import { beamAim, headAngles, lightLevel } from '@/stage/lighting'
import { hangs, trussTiles, type Tile } from '@/stage/tiling'
import { fitDistance } from '@/stage/camera'
import { stageView, useStageView } from '@/stage/view'
import { useStageAssets, type FixtureModel, type FixtureRole, type StageAssets } from './assets'
import { createBeamMaterial } from './beamMaterial'
import { ModelInstances } from './ModelInstances'
import { createFlareTexture } from './flare'

type BodyKind = 'deck' | 'truss' | 'speaker' | 'screen'
const BODY_KINDS: BodyKind[] = ['deck', 'truss', 'speaker', 'screen']
const BODY_COLORS: Record<BodyKind, string> = { deck: '#262626', truss: '#1c1c1c', speaker: '#111111', screen: '#0a0a0a' }
const BEAM_MIN_HEIGHT = 3
const NO_AIM = { pan: 0, tilt: 0 }
const SEGMENT = 2 // truss segment length, m
const HEAD_SIZE = 0.6 // moving-head height, m
const PAR_SIZE = 0.5
const WASH_LENGTH = 2.5
const LENS_HEAD = 0.6 // lens disc scale on a moving head
const LENS_PAR = 0.6

// Scratch objects reused every frame (no per-frame allocation).
const obj = new THREE.Object3D()
const col = new THREE.Color()
const hueCol = new THREE.Color()
const camTarget = new THREE.Vector3()
const toCam = new THREE.Vector3()
const scaleV = new THREE.Vector3()
const anchor = new THREE.Vector3()
const turn = new THREE.Quaternion()
const tmp = new THREE.Matrix4()
const Y = new THREE.Vector3(0, 1, 0)
const quat = (x: number, y: number, z: number) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z))
const FLIP = quat(0, 0, Math.PI) // hung fixtures hang upside down
const TILE_TURN = [quat(0, 0, -Math.PI / 2), quat(0, 0, 0), quat(Math.PI / 2, 0, 0)] // model's long axis (y) → part axis x / y / z
const HANG_TURN = quat(0, 0, 0) // model grilles already face the audience (+z)
const PAR_TURN = quat(0, Math.PI, 0) // uplights face upstage, at the rig and screen
const PAR_LENS = new THREE.Vector3(0, 0.55, 0.45) // par lens centre (model faces +z)
const PAR_BEAM = new THREE.Euler(Math.PI - 0.35, 0, 0) // floor wash: up and back toward the rig
// Per-light fixture matrices, written by Rig before the model instances read them. One scene at a time.
const fixtures: Record<FixtureRole, THREE.Matrix4>[] = []
const fixtureAt = (i: number) => (fixtures[i] ??= { base: new THREE.Matrix4(), yoke: new THREE.Matrix4(), head: new THREE.Matrix4() })
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

function placeTile({ p, t }: { p: Part; t: Tile }, model: FixtureModel, out: THREE.Matrix4) {
  placePart(p, stageView.get().progress)
  obj.position.x += t.start[0]
  obj.position.y += t.start[1]
  obj.position.z += t.start[2]
  const cross = Math.min(p.size[(t.axis + 1) % 3], p.size[(t.axis + 2) % 3])
  out.compose(obj.position, TILE_TURN[t.axis], scaleV.set(cross / model.size.x, t.length, cross / model.size.z))
}

function placeHang(h: Part, out: THREE.Matrix4) {
  placePart(h, stageView.get().progress)
  obj.position.y -= h.size[1] / 2 // model base sits at y = 0
  out.compose(obj.position, HANG_TURN, scaleV.setScalar(h.size[1]))
}

/** RoomEnvironment reflections for the models' standard materials. */
function Environment() {
  const get = useThree((s) => s.get)
  useEffect(() => {
    const { gl, scene } = get()
    const pmrem = new THREE.PMREMGenerator(gl)
    const room = new RoomEnvironment()
    const envTarget = pmrem.fromScene(room, 0.04)
    room.dispose()
    pmrem.dispose()
    scene.environment = envTarget.texture
    scene.environmentIntensity = 0.35
    return () => {
      scene.environment = null
      envTarget.dispose() // frees the cube-UV framebuffer, not just its texture
    }
  }, [get])
  return null
}

function Rig({ lights, reduced, assets }: { lights: Part[]; reduced: boolean; assets: StageAssets }) {
  const head = assets.movingHead
  const par = assets.par
  const hungIdx = useMemo(() => lights.flatMap((p, i) => (p.position[1] > BEAM_MIN_HEIGHT ? [i] : [])), [lights])
  const deckIdx = useMemo(() => lights.flatMap((p, i) => (p.position[1] > BEAM_MIN_HEIGHT ? [] : [i])), [lights])
  const lensRef = useRef<THREE.InstancedMesh>(null)
  const flareRef = useRef<THREE.InstancedMesh>(null)
  const beamRef = useRef<THREE.InstancedMesh>(null)
  const washRef = useRef<THREE.PointLight>(null)

  const beamGeometry = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.04, 0.13, 1, 48, 24, true)
    g.translate(0, -0.5, 0) // narrow end at the fixture, wide end 1 unit below
    g.setAttribute('aLevel', new THREE.InstancedBufferAttribute(new Float32Array(lights.length), 1))
    return g
  }, [lights.length])
  const beamMaterial = useMemo(() => createBeamMaterial(), [])
  // Lens disc faces along the beam (-y), sitting just in front of the fixture.
  const lensGeometry = useMemo(() => new THREE.CircleGeometry(0.16, 32).rotateX(Math.PI / 2).translate(0, -0.02, 0), [])
  const flare = useMemo(() => createFlareTexture(), [])
  useEffect(
    () => () => {
      beamGeometry.dispose()
      beamMaterial.dispose()
      lensGeometry.dispose()
      flare.dispose()
    },
    [beamGeometry, beamMaterial, lensGeometry, flare],
  )

  // instanceColor must exist before the first render so the materials compile with it.
  useLayoutEffect(() => {
    for (const mesh of [lensRef.current, flareRef.current]) {
      if (!mesh) continue
      for (let i = 0; i < lights.length; i++) mesh.setColorAt(i, col.setRGB(0, 0, 0))
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
  }, [lights.length])

  useFrame((state) => {
    const lens = lensRef.current
    const flares = flareRef.current
    const beams = beamRef.current
    if (!lens || !flares || !beams) return
    const { progress } = stageView.get()
    const c = consoleStore.get()
    const time = state.clock.elapsedTime
    const show = showProgress(progress)
    hueCol.setHSL(c.hue / 360, 1, 0.55)
    // Read material/geometry back off the mesh so the compiler sees no mutation of memoised values.
    const mat = beams.material as THREE.ShaderMaterial
    mat.uniforms.uColor.value.copy(hueCol)
    mat.uniforms.uTime.value = reduced ? 0 : time % 256 // still haze under reduced motion; bounded for mobile float precision
    mat.uniforms.uHaze.value = c.fog
    const levels = beams.geometry.getAttribute('aLevel') as THREE.InstancedBufferAttribute

    let sum = 0
    for (let i = 0; i < lights.length; i++) {
      const p = lights[i]
      const on = lightsOn(progress, i, lights.length)
      const base = reduced
        ? on * 0.85 * c.master * c.intensity // steady: no chase under reduced motion
        : lightLevel({ progress, index: i, count: lights.length, time, tempo: c.tempo }) * c.master * c.intensity
      const level = base + flash.value * on
      levels.setX(i, level)
      sum += level

      placePart(p, progress)
      const hung = p.position[1] > BEAM_MIN_HEIGHT
      const aim = hung ? beamAim({ show, index: i, count: lights.length, time, reduced }) : NO_AIM
      let lensScale = 1
      if (hung && head) {
        // Base clamped under the truss; yoke pans about world y; head tilts about its pivot. Lens = head's front.
        const f = fixtureAt(i)
        const { yaw, tilt } = headAngles(aim)
        anchor.set(obj.position.x, obj.position.y + p.size[1] / 2 + 0.1, obj.position.z)
        scaleV.setScalar(HEAD_SIZE)
        f.base.compose(anchor, FLIP, scaleV)
        f.yoke.compose(anchor, turn.setFromAxisAngle(Y, yaw).multiply(FLIP), scaleV)
        f.head
          .copy(f.yoke)
          .multiply(tmp.makeTranslation(head.pivot))
          .multiply(tmp.makeRotationX(tilt))
          .multiply(tmp.makeTranslation(-head.pivot.x, -head.pivot.y, -head.pivot.z))
        obj.position.set(head.pivot.x, 1, head.pivot.z).applyMatrix4(f.head)
        lensScale = LENS_HEAD
      } else if (!hung && par) {
        const f = fixtureAt(i)
        anchor.set(obj.position.x, obj.position.y - p.size[1] / 2, obj.position.z)
        f.base.compose(anchor, PAR_TURN, scaleV.setScalar(PAR_SIZE))
        obj.position.copy(PAR_LENS).applyMatrix4(f.base)
        lensScale = LENS_PAR
      }

      const h = hung ? obj.position.y : par ? WASH_LENGTH : 0
      // Beams hang along -y; negative x rotation leans them toward the audience (+z). Ground washes face the audience.
      if (hung || !par) obj.rotation.set(hung ? -aim.tilt : -Math.PI / 2, 0, aim.pan)
      else obj.rotation.copy(PAR_BEAM)
      obj.scale.setScalar(lensScale)
      obj.updateMatrix()
      lens.setMatrixAt(i, obj.matrix)
      lens.setColorAt(i, col.copy(hueCol).multiplyScalar(0.15 + level * 2.5))

      obj.scale.set(h, h, h)
      obj.updateMatrix()
      beams.setMatrixAt(i, obj.matrix)

      // Flare: camera-facing glow, nudged toward the camera so the deck doesn't clip ground washes.
      obj.position.addScaledVector(toCam.subVectors(state.camera.position, obj.position).normalize(), 0.4)
      obj.quaternion.copy(state.camera.quaternion)
      obj.scale.setScalar(0.4 + level * 0.9)
      obj.updateMatrix()
      flares.setMatrixAt(i, obj.matrix)
      flares.setColorAt(i, col.copy(hueCol).multiplyScalar(level))
    }

    levels.needsUpdate = true
    lens.instanceMatrix.needsUpdate = true
    if (lens.instanceColor) lens.instanceColor.needsUpdate = true
    flares.instanceMatrix.needsUpdate = true
    if (flares.instanceColor) flares.instanceColor.needsUpdate = true
    beams.instanceMatrix.needsUpdate = true
    if (washRef.current) {
      washRef.current.color.copy(hueCol)
      washRef.current.intensity = (sum / Math.max(1, lights.length)) * 40
    }
  }, -1) // before the fixture instances read this frame's matrices

  return (
    <>
      <instancedMesh ref={lensRef} args={[lensGeometry, undefined, lights.length]} frustumCulled={false}>
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={beamRef} args={[beamGeometry, beamMaterial, lights.length]} frustumCulled={false} />
      <instancedMesh ref={flareRef} args={[undefined, undefined, lights.length]} frustumCulled={false}>
        <planeGeometry args={[1.2, 1.2]} />
        <meshBasicMaterial map={flare} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </instancedMesh>
      <pointLight ref={washRef} position={[0, 6, 2]} distance={30} decay={1.5} intensity={0} />
      {head && hungIdx.length > 0 && (
        <ModelInstances model={head} count={hungIdx.length} place={(i, mesh, out) => out.copy(fixtureAt(hungIdx[i])[mesh.role])} />
      )}
      {par && deckIdx.length > 0 && (
        <ModelInstances model={par} count={deckIdx.length} place={(i, _mesh, out) => out.copy(fixtureAt(deckIdx[i]).base)} />
      )}
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
  const assets = useStageAssets()
  const tiles = useMemo(() => groups.truss.flatMap((p) => trussTiles(p.size, SEGMENT).map((t) => ({ p, t }))), [groups])
  const hangParts = useMemo(() => hangs(groups.speaker), [groups])
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
    const show = showProgress(progress)
    if (fogRef.current) fogRef.current.density = 0.006 + c.fog * 0.035 + show * 0.01

    const p = Math.min(progress / ASSEMBLY_END, 1)
    const live = progress >= ASSEMBLY_END && !reduced
    const fitZ = fitDistance(stage.bounds[0], (state.camera as THREE.PerspectiveCamera).fov, state.size.width / state.size.height)
    const startZ = Math.max(30, fitZ * 1.4)
    const endZ = Math.max(19, fitZ)
    // Show: arc ~18° around the stage and push in 8%.
    const angle = (reduced ? 0 : show) * THREE.MathUtils.degToRad(18)
    const dist = (startZ + (endZ - startZ) * p) * (1 - 0.08 * (reduced ? 0 : show))
    camTarget.set(
      Math.sin(angle) * dist + (live ? state.pointer.x * 0.8 : 0),
      7 - 2.5 * p - 0.5 * show + (live ? state.pointer.y * 0.4 : 0),
      Math.cos(angle) * dist,
    )
    state.camera.position.lerp(camTarget, reduced ? 1 : 0.08)
    state.camera.lookAt(0, 3 + 1.2 * (reduced ? 1 : showProgress(progress)), 0) // tilt up during the show so the rig and its lenses stay in frame

    if (bloomRef.current) bloomRef.current.intensity = 0.5 + flash.value * 1.4
  })

  return (
    <>
      <color attach="background" args={['#0e0e0e']} />
      <fogExp2 ref={fogRef} attach="fog" args={['#0e0e0e', 0.02]} />
      <Environment />
      <ambientLight intensity={0.25} />
      <directionalLight position={[6, 12, 10]} intensity={0.8} />
      <group key={seed}>
        {BODY_KINDS.map(
          (k) =>
            groups[k].length > 0 &&
            !(k === 'truss' && assets.truss) &&
            !(k === 'speaker' && assets.lineArray) && <Bodies key={k} kind={k} parts={groups[k]} />,
        )}
        {assets.truss && tiles.length > 0 && (
          <ModelInstances model={assets.truss} count={tiles.length} place={(i, _mesh, out) => placeTile(tiles[i], assets.truss!, out)} />
        )}
        {assets.lineArray && hangParts.length > 0 && (
          <ModelInstances model={assets.lineArray} count={hangParts.length} place={(i, _mesh, out) => placeHang(hangParts[i], out)} />
        )}
        <Rig lights={groups.light} reduced={reduced} assets={assets} />
      </group>
      {!lite && (
        <EffectComposer multisampling={0}>
          <Bloom ref={bloomRef} mipmapBlur luminanceThreshold={0.55} intensity={0.5} />
        </EffectComposer>
      )}
    </>
  )
}
