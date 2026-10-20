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
      onPointerDown={fire}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) {
          e.preventDefault()
          fire()
        }
      }}
    >
      {label}
    </button>
  )
}
