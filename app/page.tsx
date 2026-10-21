import { HeroStage } from '@/components/sections/HeroStage'
import { Manifesto } from '@/components/sections/Manifesto'
import { ContactBlock } from '@/components/sections/ContactBlock'
import { ServiceRack } from '@/components/sections/ServiceRack'
import { WorkList } from '@/components/sections/WorkList'
import { Section } from '@/components/Section'
import { agency } from '@/content/agency'
import { shows } from '@/content/shows'

export default function Home() {
  return (
    <>
      <div data-pin-spacer>
      <Section cue={1} level={1} className="relative isolate flex min-h-[calc(100svh-var(--console-h))] flex-col justify-end">
        <HeroStage />
      </Section>
      </div>

      <Section cue={2} bare>
        <Manifesto lines={agency.manifesto} />
      </Section>

      <Section cue={3}>
        <WorkList shows={shows} />
      </Section>

      <Section cue={4}>
        <ServiceRack services={agency.services} />
      </Section>

      <Section cue={5}>
        <ContactBlock />
      </Section>
    </>
  )
}
