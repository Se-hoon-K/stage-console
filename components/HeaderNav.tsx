'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { TransitionLink } from '@/components/TransitionLink'
import { CUES } from '@/content/cues'
import { scrollToCue } from '@/lib/scroll'

export function HeaderNav() {
  const [open, setOpen] = useState(false)
  const home = usePathname() === '/'
  const btn = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      btn.current?.focus()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])
  return (
    <nav aria-label="Main" className="header-nav">
      <button ref={btn} type="button" className="header-menu label md:hidden" aria-expanded={open} aria-controls="main-nav-list" onClick={() => setOpen((o) => !o)}>
        Menu
      </button>
      <ul id="main-nav-list" data-open={open} className="label header-nav-list">
        {CUES.map((c) => (
          <li key={c.n}>
            <TransitionLink href={`/#cue-${c.n}`} className="hover:text-ink" onClick={(e) => {
                setOpen(false)
                if (home && scrollToCue(c.n)) e.preventDefault()
              }}
            >
              {c.label}
            </TransitionLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
