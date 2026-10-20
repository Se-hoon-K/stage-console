import { memo, useMemo } from 'react'
import { toElevation } from './elevation'
import type { Stage } from './generateStage'

type Props = { stage: Stage; hue: number; className?: string }

/** Static front elevation: the no-WebGL fallback and the Work list preview. */
export const StageSvg = memo(function StageSvg({ stage, hue, className }: Props) {
  const el = useMemo(() => toElevation(stage), [stage])
  return (
    <svg viewBox={el.viewBox} className={className} aria-hidden="true" preserveAspectRatio="xMidYMax meet">
      <line x1="-100" x2="100" y1="0" y2="0" stroke="var(--color-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {el.rects.map((r) => (
        <rect
          key={r.id}
          x={r.x}
          y={r.y}
          width={r.w}
          height={r.h}
          fill={r.kind === 'deck' ? 'var(--color-panel)' : 'none'}
          stroke="var(--color-ink)"
          strokeOpacity={r.kind === 'screen' ? 0.4 : 0.8}
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {el.lights.map((l) => (
        <circle key={l.id} cx={l.cx} cy={l.cy} r={l.r} fill={`hsl(${Math.round(hue)} 100% 60%)`} />
      ))}
    </svg>
  )
})
