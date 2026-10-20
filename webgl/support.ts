let cached: boolean | null = null

/** Can this browser create a WebGL context? Cached after the first check. */
export function canUseWebGL(): boolean {
  if (cached !== null) return cached
  try {
    const canvas = document.createElement('canvas')
    cached = Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    cached = false
  }
  return cached
}

export function resetWebGLSupportCache() {
  cached = null
}
