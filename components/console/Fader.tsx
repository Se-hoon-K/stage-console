'use client'

import { useId } from 'react'
import { DEFAULTS, RANGES, consoleStore, useConsole } from '@/console/store'

type Props = {
  id: 'master' | 'hue' | 'intensity'
  label: string
  step: number
  format: (v: number) => string
}

export function Fader({ id, label, step, format }: Props) {
  const inputId = useId()
  const [min, max] = RANGES[id]
  const value = useConsole((s) => s[id])

  return (
    <div className="fader">
      <label htmlFor={inputId} className="console-label">
        {label}
      </label>
      <input
        id={inputId}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={format(value)}
        onChange={(e) => consoleStore.setValue(id, Number(e.currentTarget.value))}
        onDoubleClick={() => consoleStore.setValue(id, DEFAULTS[id])}
      />
      <span className="console-value" aria-hidden="true">
        {format(value)}
      </span>
    </div>
  )
}
