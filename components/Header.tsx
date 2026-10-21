import { TransitionLink } from '@/components/TransitionLink'
import { SoundToggle } from '@/components/console/SoundToggle'
import { agency } from '@/content/agency'
import { CUES } from '@/content/cues'

export function Header() {
  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-6 border-b border-line bg-stage/90 px-5 py-3 backdrop-blur md:px-10">
      <TransitionLink href="/" className="font-display text-lg font-black uppercase tracking-tight">
        {agency.name}
      </TransitionLink>
      <nav aria-label="Main" className="overflow-x-auto">
        <ul className="label flex gap-4">
          {CUES.map((c) => (
            <li key={c.n}>
              <TransitionLink href={`/#cue-${c.n}`} className="hover:text-ink">
                {c.label}
              </TransitionLink>
            </li>
          ))}
        </ul>
      </nav>
      <SoundToggle />
    </header>
  )
}
