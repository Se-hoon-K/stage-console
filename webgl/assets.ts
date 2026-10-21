'use client'

import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

export type FixtureKind = 'movingHead' | 'par' | 'truss' | 'lineArray'
export type FixtureRole = 'base' | 'yoke' | 'head'
export type FixtureMesh = { geometry: THREE.BufferGeometry; material: THREE.Material; role: FixtureRole }
/** `size` is the normalised model's bounding size; `pivot` is the head tilt axis for moving heads, else zero. */
export type FixtureModel = { meshes: FixtureMesh[]; size: THREE.Vector3; pivot: THREE.Vector3 }
export type StageAssets = Partial<Record<FixtureKind, FixtureModel>>

const URLS: Record<FixtureKind, string> = {
  movingHead: '/models/moving-head.glb',
  par: '/models/par.glb',
  truss: '/models/truss.glb',
  lineArray: '/models/line-array.glb',
}

const defaultLoad = (url: string) => new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(url)

/** Never rejects: a model that fails to load or parse is simply missing from the record. */
export async function loadStageAssets(load: (url: string) => Promise<GLTF> = defaultLoad): Promise<StageAssets> {
  const kinds = Object.keys(URLS) as FixtureKind[]
  const results = await Promise.allSettled(kinds.map(async (kind) => toModel(kind, await load(URLS[kind]))))
  const out: StageAssets = {}
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') out[kinds[i]] = r.value
  })
  return out
}

let pending: Promise<StageAssets> | undefined

/** Starts loading on first mount (once per page load); returns `{}` until loaded. */
export function useStageAssets(): StageAssets {
  const [assets, setAssets] = useState<StageAssets>({})
  useEffect(() => {
    let live = true
    ;(pending ??= loadStageAssets()).then((a) => {
      if (Object.keys(a).length === 0) pending = undefined // nothing loaded (offline?): retry on the next mount
      if (live) setAssets(a)
    })
    return () => {
      live = false
    }
  }, [])
  return assets
}

// glTF quantisation (KHR_mesh_quantization) stores normalised ints; baking a transform into them would clamp to [-1, 1].
function toFloat(geometry: THREE.BufferGeometry, name: string) {
  const attr = geometry.getAttribute(name)
  if (!attr || attr.array instanceof Float32Array) return
  const out = new Float32Array(attr.count * attr.itemSize)
  for (let i = 0; i < attr.count; i++)
    for (let c = 0; c < attr.itemSize; c++) out[i * attr.itemSize + c] = attr.getComponent(i, c)
  geometry.setAttribute(name, new THREE.BufferAttribute(out, attr.itemSize))
}

function roleFromNames(obj: THREE.Object3D): FixtureRole | undefined {
  for (let o: THREE.Object3D | null = obj; o; o = o.parent) {
    if (/head|lamp|lens/i.test(o.name)) return 'head'
    if (/yoke|arm|fork|support/i.test(o.name)) return 'yoke'
    if (/base/i.test(o.name)) return 'base'
  }
}

function toModel(kind: FixtureKind, gltf: GLTF): FixtureModel {
  gltf.scene.updateMatrixWorld(true)
  const meshes: (FixtureMesh & { named: boolean })[] = []
  gltf.scene.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    const geometry = mesh.geometry.clone()
    for (const name of ['position', 'normal', 'tangent']) toFloat(geometry, name)
    geometry.applyMatrix4(mesh.matrixWorld)
    const named = kind === 'movingHead' ? roleFromNames(mesh) : undefined
    const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material
    // The source exports aluminium as metalness 0; set once at load, before anything shares it.
    if (kind === 'truss' && material instanceof THREE.MeshStandardMaterial) Object.assign(material, { metalness: 0.85, roughness: 0.35 })
    meshes.push({ geometry, material, role: named ?? 'base', named: !!named })
  })
  if (!meshes.length) throw new Error(`${kind}: no meshes`)

  const box = new THREE.Box3()
  const boxOf = (g: THREE.BufferGeometry) => (g.computeBoundingBox(), g.boundingBox!)
  meshes.forEach((m) => box.union(boxOf(m.geometry)))
  const raw = box.getSize(new THREE.Vector3())

  // Truss: stand the long axis on y so a vertical tower is the identity placement, then normalise to unit length.
  const turn = new THREE.Matrix4()
  if (kind === 'truss' && raw.x >= raw.y && raw.x >= raw.z) turn.makeRotationZ(Math.PI / 2)
  else if (kind === 'truss' && raw.z > raw.y) turn.makeRotationX(Math.PI / 2)
  box.applyMatrix4(turn)

  const center = box.getCenter(new THREE.Vector3())
  const height = box.max.y - box.min.y
  if (!(height > 0)) throw new Error(`${kind}: model has no height`) // falls back to procedural geometry
  const scale = 1 / height
  const fit = new THREE.Matrix4()
    .makeScale(scale, scale, scale)
    .multiply(new THREE.Matrix4().makeTranslation(-center.x, -box.min.y, -center.z))
    .multiply(turn)
  meshes.forEach((m) => m.geometry.applyMatrix4(fit))
  const size = box.getSize(new THREE.Vector3()).multiplyScalar(scale)

  const pivot = new THREE.Vector3()
  if (kind === 'movingHead') {
    // No names matched: the upper 60% of the fixture (by mesh centre) is the head.
    if (!meshes.some((m) => m.named))
      meshes.forEach((m) => (m.role = boxOf(m.geometry).getCenter(new THREE.Vector3()).y > 0.4 ? 'head' : 'base'))
    // Tilt axis = centre of the head's bounding box (source nodes carry no pivot transforms).
    const head = new THREE.Box3()
    meshes.filter((m) => m.role === 'head').forEach((m) => head.union(boxOf(m.geometry)))
    if (!head.isEmpty()) head.getCenter(pivot)
  }

  return { meshes: meshes.map(({ geometry, material, role }) => ({ geometry, material, role })), size, pivot }
}
