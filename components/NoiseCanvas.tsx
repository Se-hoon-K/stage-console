'use client'

import { useEffect, useRef } from 'react'

/** TV static. Small canvas scaled up; ~12 fps; a single frame under reduced motion. */
export function NoiseCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const img = ctx.createImageData(canvas.width, canvas.height)
    const draw = () => {
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 60
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v
        img.data[i + 3] = 255
      }
      ctx.putImageData(img, 0, 0)
    }
    draw()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(draw, 80)
    return () => window.clearInterval(id)
  }, [])

  return <canvas ref={ref} width={160} height={90} aria-hidden="true" className="absolute inset-0 -z-10 h-full w-full opacity-40 [image-rendering:pixelated]" />
}
