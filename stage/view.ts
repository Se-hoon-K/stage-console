import { agency } from '@/content/agency'
import { createStore } from '@/lib/store'

export type StageViewState = { seed: number; progress: number; visible: boolean; webglReady: boolean }

const base = createStore<StageViewState>({ seed: agency.heroSeed, progress: 0, visible: false, webglReady: false })
// Sections currently showing the canvas (the pinned stage, backdrop sections). Visible while any is on.
const owners = new Set<object>()

export const stageView = {
  ...base,
  set(partial: Partial<StageViewState>) {
    const next = { ...partial }
    if (next.progress !== undefined) {
      if (Number.isNaN(next.progress)) delete next.progress
      else next.progress = Math.min(1, Math.max(0, next.progress))
    }
    base.set(next)
  },
  reset() {
    owners.clear()
    base.reset()
  },
}

export function showStageFor(owner: object, on: boolean) {
  if (on) owners.add(owner)
  else owners.delete(owner)
  base.set({ visible: owners.size > 0 })
}

export const useStageView = base.use
