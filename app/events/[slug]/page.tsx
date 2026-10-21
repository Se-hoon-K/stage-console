import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { EventStage } from '@/components/event/EventStage'
import { RunSheet } from '@/components/event/RunSheet'
import { StatCounter } from '@/components/event/StatCounter'
import { TransitionLink } from '@/components/TransitionLink'
import { agency } from '@/content/agency'
import { shows } from '@/content/shows'

// Every slug is prerendered by generateStaticParams, and the page transition shutter covers the wait.
export const instant = false

type Props = { params: Promise<{ slug: string }> }

export function formatShowDate(iso: string) {
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(iso))
}

export function generateStaticParams() {
  return shows.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const show = shows.find((s) => s.slug === slug)
  if (!show) return {}
  return {
    title: `${show.name} — ${agency.name} (portfolio piece)`,
    description: `${show.type} in ${show.city} for ${show.capacity.toLocaleString('en-AU')} people. A fictional show by a fictional agency; portfolio piece by ${agency.credits.author}.`,
  }
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params
  const index = shows.findIndex((s) => s.slug === slug)
  if (index === -1) notFound()
  const show = shows[index]
  const next = shows[(index + 1) % shows.length]

  const facts: [string, string][] = [
    ['Date', formatShowDate(show.date)],
    ['Venue', show.venue],
    ['City', show.city],
    ['Capacity', show.capacity.toLocaleString('en-AU')],
    ['Type', show.type],
  ]

  return (
    <article>
      <header className="bg-stage px-5 pb-16 pt-24 md:px-10">
        <p className="label mb-6">
          {show.type} — {show.city}
        </p>
        <h1 className="font-display text-[clamp(3.5rem,12vw,13rem)] font-black uppercase leading-[0.85] tracking-tight">{show.name}</h1>
        <ul aria-label="Show facts" className="mt-12 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-5">
          {facts.map(([label, value]) => (
            <li key={label} className="bg-stage p-4">
              <p className="label">{label}</p>
              <p className="mt-2 font-mono text-sm uppercase text-ink">{value}</p>
            </li>
          ))}
        </ul>
      </header>

      <EventStage seed={show.seed} name={show.name} />

      {show.runSheet.length > 0 && <RunSheet items={show.runSheet} />}

      {show.stats.length > 0 && (
        <section aria-labelledby="stats-title" className="border-t border-line bg-stage px-5 py-24 md:px-10">
          <h2 id="stats-title" className="label mb-10">
            By the numbers
          </h2>
          <ul className="grid grid-cols-2 gap-px bg-line md:grid-cols-4">
            {show.stats.map((s) => (
              <li key={s.label} className="bg-stage p-6">
                <StatCounter value={s.value} unit={s.unit} />
                <p className="label mt-3">{s.label}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <nav aria-label="Next show" className="border-t border-line bg-stage px-5 py-24 md:px-10">
        <p className="label mb-6">Next show</p>
        <TransitionLink href={`/events/${next.slug}`} className="next-show block text-[clamp(2.5rem,9vw,9rem)] font-black uppercase leading-[0.85] tracking-tight">
          {next.name} →
        </TransitionLink>
      </nav>
    </article>
  )
}
