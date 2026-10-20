import { HeroStage } from '@/components/sections/HeroStage'
import { Manifesto } from '@/components/sections/Manifesto'
import { Section } from '@/components/Section'
import { agency } from '@/content/agency'

export default function Home() {
  return (
    <>
      <Section cue={1} level={1} className="relative isolate flex min-h-[calc(100svh-var(--console-h))] flex-col justify-end">
        <HeroStage />
      </Section>

      <Section cue={2}>
        <Manifesto lines={agency.manifesto} />
      </Section>

      <Section cue={3} />

      <Section cue={4}>
        <ul className="mt-12 grid gap-px bg-line md:grid-cols-2">
          {agency.services.map((s) => (
            <li key={s.id} className="bg-stage p-6">
              <h3 className="text-2xl font-bold uppercase">{s.title}</h3>
              <p className="mt-2 text-mute">{s.summary}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section cue={5}>
        <a href={`mailto:${agency.email}`} className="mt-12 block text-[clamp(1.5rem,5vw,4rem)] font-bold hover:text-led">
          {agency.email}
        </a>
      </Section>
    </>
  )
}
