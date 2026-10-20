let cached: boolean | null = null

/** Can this browser create a WebGL context? Cached after the first check. */
export function canUseWebGL(): boolean {
  if (cached !== null) return cached
  try {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    cached = Boolean(ctx)
    ;(ctx as WebGLRenderingContext | null)?.getExtension?.('WEBGL_lose_context')?.loseContext()
  } catch {
    cached = false
  }
  return cached
}

export function resetWebGLSupportCache() {
  cached = null
}
