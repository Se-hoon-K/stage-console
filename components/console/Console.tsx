'use client'

import { useEffect, useState } from 'react'
import type { PadKind } from '@/console/audio'
import { CUES, cueLabel } from '@/content/cues'
import { useConsole } from '@/console/store'
import { useCueTracking } from '@/console/useCueTracking'
import { CueButton } from './CueButton'
import { Fader } from './Fader'
import { Knob } from './Knob'
import { Meter } from './Meter'
import { Pad } from './Pad'
import { SoundToggle } from './SoundToggle'
import './console.css'

export const pct = (v: number) => `${Math.round(v * 100)}%`
export const deg = (v: number) => `${Math.round(v)}°`
export const bpm = (v: number) => `${Math.round(v)} BPM`

const PADS: { kind: PadKind; label: string }[] = [
  { kind: 'kick', label: 'Kick' },
  { kind: 'hit', label: 'Hit' },
  { kind: 'riser', label: 'Riser' },
  { kind: 'drop', label: 'Drop' },
]

export function Console() {
  useCueTracking()
  const [open, setOpen] = useState(false)
  const activeCue = useConsole((s) => s.activeCue)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <a href="#main" className="skip-link">Skip console</a>
      <section aria-label="Show console" className="console" data-lenis-prevent data-open={open}>
        <div className="console-bar">
          <span className="console-bar-cue">
            {cueLabel(activeCue)} — {CUES[activeCue - 1]?.label}
          </span>
          <button type="button" className="cue-button" aria-expanded={open} aria-controls="console-panel" onClick={() => setOpen((o) => !o)}>
            <span className="led" data-on={open} aria-hidden="true" />
            Console
          </button>
        </div>
        <div id="console-panel" className="console-panel">
          <div className="console-group">
            <SoundToggle />
          </div>
          <div className="console-group" role="group" aria-label="Cues">
            {CUES.map((c) => (
              <CueButton key={c.n} cue={c.n} label={c.label} />
            ))}
          </div>
          <div className="console-group" role="group" aria-label="Lights">
            <Fader id="master" label="Master" step={0.01} format={pct} />
            <Fader id="hue" label="Hue" step={1} format={deg} />
            <Fader id="intensity" label="Intensity" step={0.01} format={pct} />
          </div>
          <div className="console-group" role="group" aria-label="Atmosphere">
            <Knob id="tempo" label="Tempo" detents={12} format={bpm} />
            <Knob id="fog" label="Fog" detents={10} format={pct} />
          </div>
          <div className="console-group" role="group" aria-label="Pads">
            {PADS.map((p) => (
              <Pad key={p.kind} kind={p.kind} label={p.label} />
            ))}
          </div>
          <div className="console-group">
            <Meter />
          </div>
        </div>
      </section>
    </>
  )
}
