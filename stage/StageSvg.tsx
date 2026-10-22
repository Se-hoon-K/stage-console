import { type CSSProperties, memo, useId, useMemo } from 'react'
import { toElevation } from './elevation'
import type { Stage } from './generateStage'
import { fixtureHsl, HUNG_MIN_HEIGHT } from './lighting'

const hsl = ([h, s, l]: [number, number, number]) => `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`

/** Line width in metres for the blueprint (≈2–3 px at desktop hero size). */
const BLUEPRINT_STROKE = 0.04

type Props = { stage: Stage; hue: number; className?: string; draw?: boolean }

/**
 * Front elevation: the no-WebGL fallback and the Work list preview. With `draw`, it draws itself in like a
 * blueprint (globals.css .stage-blueprint) while the 3D stage loads, in assembly order.
 */
export const StageSvg = memo(function StageSvg({ stage, hue, className = '', draw = false }: Props) {
  const el = useMemo(() => toElevation(stage), [stage])
  const gridId = useId() // hero and event stages can both be mounted (Activity): keep pattern ids unique
  return (
    <svg
      viewBox={el.viewBox}
      className={draw ? `stage-blueprint ${className}` : className}
      aria-hidden="true"
      preserveAspectRatio="xMidYMax meet"
    >
      {draw && (
        <>
          <defs>
            <pattern id={gridId} width="1" height="1" patternUnits="userSpaceOnUse">
              <path d="M 1 0 L 0 0 0 1" fill="none" stroke="var(--color-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            </pattern>
          </defs>
          <rect className="blueprint-grid" x="-100" y="-100" width="200" height="100" fill={`url(#${gridId})`} />
        </>
      )}
      <line x1="-100" x2="100" y1="0" y2="0" stroke="var(--color-line)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      {el.rects.map((r, i) => (
        <rect
          key={r.id}
          pathLength={1}
          style={{ '--i': i } as CSSProperties}
          x={r.x}
          y={r.y}
          width={r.w}
          height={r.h}
          fill={r.kind === 'deck' ? 'var(--color-panel)' : 'none'}
          stroke="var(--color-ink)"
          strokeOpacity={r.kind === 'screen' ? 0.4 : 0.8}
          // The blueprint animates stroke dashes, which a non-scaling stroke breaks: use a width in metres.
          strokeWidth={draw ? BLUEPRINT_STROKE : 1}
          vectorEffect={draw ? undefined : 'non-scaling-stroke'}
        />
      ))}
      {/* The blueprint draws lights as white outlines; the 3D stage and previews colour them. */}
      {el.lights.map((l, i) => (
        <circle key={l.id} style={{ '--i': i } as CSSProperties} cx={l.cx} cy={l.cy} r={l.r} {...(draw
            ? { fill: 'none', stroke: 'var(--color-ink)', strokeWidth: BLUEPRINT_STROKE }
            : { fill: hsl(fixtureHsl(hue, -l.cy <= HUNG_MIN_HEIGHT)) })} />
      ))}
    </svg>
  )
})
