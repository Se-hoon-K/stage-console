'use client'

import { useState } from 'react'
import { initAudio } from '@/console/audio'
import { consoleStore, useConsole } from '@/console/store'

export function SoundToggle() {
  const on = useConsole((s) => s.soundOn)
  const [unsupported, setUnsupported] = useState(false)

  async function toggle() {
    if (!on && !(await initAudio())) {
      setUnsupported(true)
      return
    }
    consoleStore.set({ soundOn: !on })
  }

  return (
    <button type="button" className="sound-toggle" aria-pressed={on} disabled={unsupported} onClick={toggle}>
      <span className="led" data-on={on} aria-hidden="true" />
      {unsupported ? 'No audio' : 'Sound'}
      {!unsupported && (
        <span className="sound-state" aria-hidden="true">
          {on ? 'On' : 'Off'}
        </span>
      )}
    </button>
  )
}
