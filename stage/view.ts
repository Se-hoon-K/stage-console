import { agency } from '@/content/agency'
import { createStore } from '@/lib/store'

export type StageViewState = { seed: number; progress: number; visible: boolean; webglReady: boolean }

const base = createStore<StageViewState>({ seed: agency.heroSeed, progress: 0, visible: true, webglReady: false })

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
}

export const useStageView = base.use
