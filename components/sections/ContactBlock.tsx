'use client'

import { useEffect, useState } from 'react'
import { agency } from '@/content/agency'

export function formatCityTime(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(date)
}

export function ContactBlock() {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    const tick = () => setTime(formatCityTime(new Date(), 'Australia/Melbourne'))
    const first = window.setTimeout(tick, 0)
    const every = window.setInterval(tick, 30_000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(every)
    }
  }, [])

  return (
    <div className="mt-12">
      <a href={`mailto:${agency.email}`} aria-label={`Email ${agency.email}`} className="marquee block overflow-hidden border-y border-line py-6">
        <span className="marquee-track" aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className="marquee-item">
              {agency.email} —
            </span>
          ))}
        </span>
      </a>
      <div className="mt-10 flex flex-wrap items-center justify-between gap-6">
        <a href={`mailto:${agency.email}?subject=Book%20a%20show`} className="book-button">
          Book a show
        </a>
        <p className="label">
          <span className="led" data-on="true" aria-hidden="true" />
          Show status: live · {agency.city} {time ?? '--:--'}
        </p>
      </div>
    </div>
  )
}
