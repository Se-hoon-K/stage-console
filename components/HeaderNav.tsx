'use client'

import { useState } from 'react'
import { TransitionLink } from '@/components/TransitionLink'
import { CUES } from '@/content/cues'

export function HeaderNav() {
  const [open, setOpen] = useState(false)
  return (
    <nav aria-label="Main" className="header-nav">
      <button type="button" className="header-menu label md:hidden" aria-expanded={open} aria-controls="main-nav-list" onClick={() => setOpen((o) => !o)}>
        Menu
      </button>
      <ul id="main-nav-list" data-open={open} className="label header-nav-list">
        {CUES.map((c) => (
          <li key={c.n}>
            <TransitionLink href={`/#cue-${c.n}`} className="hover:text-ink" onClick={() => setOpen(false)}>
              {c.label}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
