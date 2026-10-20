import { useSyncExternalStore } from 'react'
import { clamp } from './controls'

export type ConsoleState = {
  soundOn: boolean
  master: number
  hue: number
  intensity: number
  tempo: number
  fog: number
  activeCue: number
}

export const RANGES = {
  master: [0, 1],
  hue: [0, 360],
  intensity: [0, 1],
  tempo: [60, 180],
  fog: [0, 1],
  activeCue: [1, 5],
} as const

export type NumericKey = keyof typeof RANGES

export const DEFAULTS: ConsoleState = {
  soundOn: false,
  master: 0.8,
  hue: 8,
  intensity: 0.7,
  tempo: 120,
  fog: 0.3,
  activeCue: 1,
}

let state: ConsoleState = { ...DEFAULTS }
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((fn) => fn())

export const consoleStore = {
  get: () => state,

  set(partial: Partial<ConsoleState>) {
    const next: ConsoleState = { ...state }
    let changed = false
    for (const key of Object.keys(partial) as (keyof ConsoleState)[]) {
      let value = partial[key]
      if (key in RANGES) {
        if (typeof value !== 'number' || Number.isNaN(value)) continue
        const [min, max] = RANGES[key as NumericKey]
        value = clamp(value, min, max)
      }
      if (value !== undefined && next[key] !== value) {
        ;(next as Record<keyof ConsoleState, unknown>)[key] = value
        changed = true
      }
    }
    if (!changed) return
    state = next
    notify()
  },

  setValue(key: NumericKey, value: number) {
    consoleStore.set({ [key]: value } as Partial<ConsoleState>)
  },

  subscribe(fn: () => void) {
    listeners.add(fn)
    return () => {
      listeners.delete(fn)
    }
  },

  reset() {
    state = { ...DEFAULTS }
    notify()
  },
}

export function useConsole<T>(selector: (s: ConsoleState) => T): T {
  return useSyncExternalStore(
    consoleStore.subscribe,
    () => selector(consoleStore.get()),
    () => selector(DEFAULTS),
  )
}
