'use client'

import { playClick } from '@/console/audio'
import { cueLabel } from '@/content/cues'
import { consoleStore, useConsole } from '@/console/store'
import { scrollToCue } from '@/lib/scroll'

export function CueButton({ cue, label }: { cue: number; label: string }) {
  const active = useConsole((s) => s.activeCue === cue)

  return (
    <button
      type="button"
      className="cue-button"
      aria-current={active ? 'true' : undefined}
      onClick={() => {
        playClick()
        if (scrollToCue(cue)) consoleStore.setValue('activeCue', cue)
      }}
    >
      <span className="led" data-on={active} aria-hidden="true" />
      {cueLabel(cue)}
      <span className="sr-only"> {label}</span>
    </button>
  )
}
