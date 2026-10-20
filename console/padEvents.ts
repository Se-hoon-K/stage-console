import type { PadKind } from './audio'

type Listener = (kind: PadKind) => void
const listeners = new Set<Listener>()

/** Pad hits for visuals (stage flash). Independent of sound. */
export function emitPadHit(kind: PadKind) {
  listeners.forEach((fn) => fn(kind))
}

export function onPadHit(fn: Listener) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
