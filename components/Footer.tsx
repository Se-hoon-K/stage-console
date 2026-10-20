import { agency } from '@/content/agency'

export function Footer() {
  const { name, credits } = agency
  return (
    <footer className="label border-t border-line px-5 py-10 md:px-10">
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
    </footer>
  )
}
