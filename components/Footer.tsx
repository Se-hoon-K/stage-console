import { agency } from '@/content/agency'
import { modelCredits } from '@/content/credits'

export function Footer() {
  const { name, credits } = agency
  return (
    <footer className="label relative z-10 border-t border-line bg-stage px-5 py-10 md:px-10">
      <p className="max-w-3xl normal-case tracking-normal">
        <span className="text-ink">{name}</span> is a fictional agency. This site is a portfolio piece designed &amp;
        developed by <span className="text-ink">{credits.author}</span>.
      </p>
      <ul className="mt-4 flex flex-wrap gap-6">
        <li>
          <a href={credits.github} className="hover:text-ink">GitHub</a>
        </li>
        {credits.linkedin && (
          <li>
            <a href={credits.linkedin} className="hover:text-ink">LinkedIn</a>
          </li>
        )}
        <li>
          <a href={credits.repo} className="hover:text-ink">Source code</a>
        </li>
      </ul>
      <p className="mt-6 max-w-3xl normal-case tracking-normal">
        3D models, modified (optimised):{' '}
        {modelCredits.map((m, i) => (
          <span key={m.url}>
            {i > 0 && ' · '}
            <a href={m.url} className="hover:text-ink">{m.title}</a> by {m.author} (
            <a href={m.licenceUrl} className="hover:text-ink">{m.licence}</a>)
          </span>
        ))}
      </p>
    </footer>
  )
}
