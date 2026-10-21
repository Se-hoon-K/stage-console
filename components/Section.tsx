import type { ReactNode } from 'react'
import { CUES, cueLabel, type CueNumber } from '@/content/cues'

type Props = { cue: CueNumber; level?: 1 | 2; className?: string; children?: ReactNode }

export function Section({ cue, level = 2, className = '', children }: Props) {
  const { label, title } = CUES[cue - 1]
  const Heading = level === 1 ? 'h1' : 'h2'
  const headingClass =
    level === 1
      ? 'font-display text-[clamp(4rem,14vw,16rem)] font-black uppercase leading-[0.85] tracking-tight'
      : 'font-display text-[clamp(2.5rem,7vw,7rem)] font-extrabold uppercase leading-[0.9] tracking-tight'

  return (
    <section
      id={`cue-${cue}`}
      data-cue={cue}
      tabIndex={-1}
      aria-labelledby={`cue-${cue}-title`}
      className={`${cue === 1 ? '' : 'border-t border-line bg-stage'} px-5 py-24 md:px-10 ${className}`}
    >
      <p className="label mb-6">
        {cueLabel(cue)} — {label}
      </p>
      <Heading id={`cue-${cue}-title`} tabIndex={level === 1 ? -1 : undefined} className={headingClass}>
        {title}
      </Heading>
      {children}
    </section>
  )
}
