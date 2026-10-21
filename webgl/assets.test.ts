import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { loadStageAssets } from './assets'

const gltfWith = (...meshes: THREE.Object3D[]) => {
  const scene = new THREE.Group()
  meshes.forEach((m) => scene.add(m.clone())) // each kind loads its own copy
  return { scene } as never
}

const boxOf = (w: number, h: number, d: number) =>
  new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial())

const bounds = (g: THREE.BufferGeometry) => {
  g.computeBoundingBox()
  return g.boundingBox!
}

describe('loadStageAssets', () => {
  it('returns no model (not an error) when a file fails to load', async () => {
    const out = await loadStageAssets(() => Promise.reject(new Error('404')))
    expect(out).toEqual({})
  })

  it('keeps the models that load when another fails', async () => {
    const out = await loadStageAssets((url) =>
      url.includes('truss') ? Promise.reject(new Error('404')) : Promise.resolve(gltfWith(boxOf(1, 1, 1))),
    )
    expect(Object.keys(out).sort()).toEqual(['lineArray', 'movingHead', 'par'])
  })

  it('flattens a model into world-baked meshes normalised to a 1 m height', async () => {
    const box = boxOf(2, 4, 2)
    box.position.set(5, 0, 0)
    const out = await loadStageAssets(() => Promise.resolve(gltfWith(box)))
    const model = out.par!
    expect(model.meshes.length).toBe(1)
    expect(model.meshes[0].role).toBe('base')
    expect(model.size.y).toBeCloseTo(1)
    expect(model.pivot.toArray()).toEqual([0, 0, 0])
    const bb = bounds(model.meshes[0].geometry)
    expect(bb.min.y).toBeCloseTo(0) // sits on its base
    expect((bb.min.x + bb.max.x) / 2).toBeCloseTo(0) // centred on x/z
  })

  it('does not clamp quantised (normalised int16) positions when baking transforms', async () => {
    const geometry = new THREE.BoxGeometry(2, 2, 2)
    const pos = geometry.getAttribute('position')
    geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(Int16Array.from(pos.array as Float32Array, (v) => v * 32767), 3, true),
    )
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial())
    mesh.position.set(5, 0, 0)
    const model = (await loadStageAssets(() => Promise.resolve(gltfWith(mesh)))).par!
    expect(model.size.x).toBeCloseTo(1)
  })

  it('stands the truss upright and normalises it to unit length along y', async () => {
    const out = await loadStageAssets(() => Promise.resolve(gltfWith(boxOf(10, 2, 2))))
    const truss = out.truss!
    expect(truss.size.y).toBeCloseTo(1)
    expect(truss.size.x).toBeCloseTo(0.2)
    expect(truss.size.z).toBeCloseTo(0.2)
  })

  it('assigns moving-head roles from node names and pivots on the head', async () => {
    const base = boxOf(2, 1, 2)
    base.name = 'Base_0'
    const yoke = boxOf(2, 2, 1)
    yoke.name = 'Support_0'
    yoke.position.y = 1.5
    const head = boxOf(1, 1, 1)
    head.name = 'Head_0'
    head.position.y = 2
    const model = (await loadStageAssets(() => Promise.resolve(gltfWith(base, yoke, head)))).movingHead!
    expect(model.meshes.map((m) => m.role)).toEqual(['base', 'yoke', 'head'])
    // height 3 → scale 1/3; head centre y = 2 + 0.5 offset (base min y was -0.5) → 2.5 / 3
    expect(model.pivot.y).toBeCloseTo(2.5 / 3)
    expect(model.pivot.x).toBeCloseTo(0)
  })

  it('splits an unnamed moving head by height when no names match', async () => {
    const low = boxOf(1, 1, 1)
    const high = boxOf(1, 1, 1)
    high.position.y = 3
    const model = (await loadStageAssets(() => Promise.resolve(gltfWith(low, high)))).movingHead!
    expect(model.meshes.map((m) => m.role)).toEqual(['base', 'head'])
  })
})
