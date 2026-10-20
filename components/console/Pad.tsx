'use client'

import { useRef, useState } from 'react'
import { type PadKind, playPad } from '@/console/audio'

export function Pad({ kind, label }: { kind: PadKind; label: string }) {
  const [lit, setLit] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  const fire = () => {
    playPad(kind)
    setLit(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setLit(false), 140)
  }

  return (
    <button
      type="button"
      className="pad"
      data-lit={lit}
      onPointerDown={(e) => {
        if (e.button === 0) fire()
      }}
      // detail 0 = click without pointer/key (VoiceOver, switch, voice control)
      onClick={(e) => {
        if (e.detail === 0) fire()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          // Always block the default so auto-repeat can't synthesize extra clicks.
          e.preventDefault()
          if (!e.repeat) fire()
        }
      }}
      // Space activates the button on keyup.
      onKeyUp={(e) => {
        if (e.key === ' ') e.preventDefault()
      }}
    >
      {label}
    </button>
  )
}
