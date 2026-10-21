'use client'

import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { FixtureMesh, FixtureModel } from './assets'

const matrix = new THREE.Matrix4()

/**
 * One InstancedMesh per model mesh, `count` instances each; `place(i, mesh, out)` writes instance i's
 * matrix every frame. Geometry and material are the session-wide shared ones: never disposed here.
 */
export function ModelInstances({
  model,
  count,
  place,
}: {
  model: FixtureModel
  count: number
  place: (i: number, mesh: FixtureMesh, out: THREE.Matrix4) => void
}) {
  const refs = useRef<(THREE.InstancedMesh | null)[]>([])
  useFrame(() => {
    for (let k = 0; k < model.meshes.length; k++) {
      const im = refs.current[k]
      if (!im) continue
      for (let i = 0; i < count; i++) {
        place(i, model.meshes[k], matrix)
        im.setMatrixAt(i, matrix)
      }
      im.instanceMatrix.needsUpdate = true
    }
  })
  return model.meshes.map((mesh, k) => (
    <instancedMesh
      key={k}
      ref={(el) => {
        refs.current[k] = el
        // dispose={null} keeps R3F off the shared geometry/material; the mesh's own instance buffers still need freeing.
        return () => el?.dispose()
      }}
      args={[mesh.geometry, mesh.material, count]}
      dispose={null}
      frustumCulled={false}
    />
  ))
}
