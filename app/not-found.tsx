import { NoiseCanvas } from '@/components/NoiseCanvas'
import { TransitionLink } from '@/components/TransitionLink'
import { agency } from '@/content/agency'

export const metadata = { title: `No signal — ${agency.name}` }

export default function NotFound() {
  return (
    <section className="relative isolate flex min-h-[calc(100svh-var(--console-h))] flex-col justify-end bg-stage px-5 py-24 md:px-10">
      <NoiseCanvas />
      <p className="label mb-6">ERR 404 — input not found</p>
      <h1 tabIndex={-1} className="font-display text-[clamp(4rem,16vw,16rem)] font-black uppercase leading-[0.85] tracking-tight">No signal</h1>
      <p className="mt-6 max-w-xl text-mute">This channel isn&apos;t patched to anything. Check the address, or head back to the stage.</p>
      <div className="mt-10">
        <TransitionLink href="/" className="book-button">
          Return to stage
        </TransitionLink>
      </div>
    </section>
  )
}
