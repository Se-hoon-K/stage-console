import { useSyncExternalStore } from 'react'

/** Tiny external store: readable every frame via get(), subscribable from React via use(). */
export function createStore<T extends object>(initial: T) {
  let state: T = { ...initial }
  const listeners = new Set<() => void>()

  const store = {
    get: () => state,

    set(partial: Partial<T>) {
      let next: T | null = null
      for (const key of Object.keys(partial) as (keyof T)[]) {
        const value = partial[key]
        if (value === undefined || value === state[key]) continue
        next ??= { ...state }
        next[key] = value as T[keyof T]
      }
      if (!next) return
      state = next
      listeners.forEach((fn) => fn())
    },

    subscribe(fn: () => void) {
      listeners.add(fn)
      return () => {
        listeners.delete(fn)
      }
    },

    reset() {
      state = { ...initial }
      listeners.forEach((fn) => fn())
    },

    /** Selector must return a primitive or otherwise stable value, or React re-renders forever. */
    use<S>(selector: (s: T) => S): S {
      return useSyncExternalStore(store.subscribe, () => selector(state), () => selector(initial))
    },
  }
  return store
}
