'use client'

import { type CSSProperties, type KeyboardEvent, useEffect, useRef } from 'react'
import { dragToValue, snapToDetent, stepValue } from '@/console/controls'
import { DEFAULTS, RANGES, consoleStore, useConsole } from '@/console/store'

type Props = {
  id: 'tempo' | 'fog'
  label: string
  detents: number
  format: (v: number) => string
}

export function Knob({ id, label, detents, format }: Props) {
  const [min, max] = RANGES[id]
  const value = useConsole((s) => s[id])
  const dialRef = useRef<HTMLDivElement>(null)
  const drag = useRef<{ y: number; v: number } | null>(null)
  const wheelAcc = useRef(0)

  // Wheel needs a non-passive listener so it can stop the page from scrolling.
  useEffect(() => {
    const el = dialRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      // Trackpads fire many small deltas: one detent per 50px accumulated.
      if (Math.sign(e.deltaY) !== Math.sign(wheelAcc.current)) wheelAcc.current = 0
      wheelAcc.current += e.deltaY
      const steps = Math.trunc(Math.abs(wheelAcc.current) / 50)
      if (!steps) return
      const dir = wheelAcc.current < 0 ? 1 : -1
      wheelAcc.current %= 50
      const current = consoleStore.get()[id]
      consoleStore.setValue(id, stepValue(current, min, max, detents, dir, steps))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [id, min, max, detents])

  const onKeyDown = (e: KeyboardEvent) => {
    const mult = e.shiftKey ? 5 : 1
    let next: number | null = null
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') next = stepValue(value, min, max, detents, 1, mult)
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') next = stepValue(value, min, max, detents, -1, mult)
    else if (e.key === 'Home') next = min
    else if (e.key === 'End') next = max
    if (next === null) return
    e.preventDefault()
    consoleStore.setValue(id, next)
  }

  const angle = -135 + 270 * ((value - min) / (max - min))

  return (
    <div className="knob">
      <div
        ref={dialRef}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={format(value)}
        className="knob-dial"
        style={{ '--angle': `${angle}deg` } as CSSProperties}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          if (e.button !== 0) return
          e.currentTarget.setPointerCapture(e.pointerId)
          drag.current = { y: e.clientY, v: value }
        }}
        onPointerMove={(e) => {
          if (!drag.current) return
          const raw = dragToValue(drag.current.v, e.clientY - drag.current.y, min, max)
          consoleStore.setValue(id, snapToDetent(raw, min, max, detents))
        }}
        onPointerUp={() => {
          drag.current = null
        }}
        onPointerCancel={() => {
          drag.current = null
        }}
        onDoubleClick={() => consoleStore.setValue(id, DEFAULTS[id])}
      >
        <span className="knob-pointer" />
      </div>
      <span className="console-label" aria-hidden="true">
        {label}
      </span>
      <span className="console-value" aria-hidden="true">
        {format(value)}
      </span>
    </div>
  )
}
