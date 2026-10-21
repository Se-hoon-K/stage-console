import * as THREE from 'three'

/** Lens glow: soft radial falloff plus a thin horizontal streak. Drawn once into a 128² canvas. */
export function createFlareTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const g = canvas.getContext('2d')!
  const r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  r.addColorStop(0, 'rgba(255,255,255,1)')
  r.addColorStop(0.15, 'rgba(255,255,255,0.6)')
  r.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = r
  g.fillRect(0, 0, size, size)
  const s = g.createLinearGradient(0, 0, size, 0)
  s.addColorStop(0, 'rgba(255,255,255,0)')
  s.addColorStop(0.5, 'rgba(255,255,255,0.7)')
  s.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = s
  g.fillRect(0, size / 2 - 1, size, 2)
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}
