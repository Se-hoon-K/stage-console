'use client'

import { useId, useState } from 'react'
import type { Service } from '@/content/agency'

function RackUnit({ service }: { service: Service }) {
  const [open, setOpen] = useState(false)
  const detailsId = useId()
  const titleId = useId()

  return (
    <li className="rack-unit relative border border-line bg-panel p-6">
      <span className="rack-screw left-2 top-2" aria-hidden="true" />
      <span className="rack-screw right-2 top-2" aria-hidden="true" />
      <span className="rack-screw bottom-2 left-2" aria-hidden="true" />
      <span className="rack-screw bottom-2 right-2" aria-hidden="true" />
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="label">{service.id}</p>
          <h3 id={titleId} className="mt-2 text-2xl font-bold uppercase">
            {service.title}
          </h3>
          <p className="mt-2 text-mute">{service.summary}</p>
        </div>
        <button
          type="button"
          className="rack-toggle"
          aria-expanded={open}
          aria-controls={detailsId}
          aria-describedby={titleId}
          onClick={() => setOpen((o) => !o)}
        >
          <span className="led" data-on={open} aria-hidden="true" />
          Details
        </button>
      </div>
      <ul id={detailsId} hidden={!open} className="label mt-4 space-y-1">
        {service.details.map((d) => (
          <li key={d}>{d}</li>
        ))}
      </ul>
    </li>
  )
}

export function ServiceRack({ services }: { services: Service[] }) {
  return (
    <ul className="mt-12 grid gap-4 md:grid-cols-2">
      {services.map((s) => (
        <RackUnit key={s.id} service={s} />
      ))}
    </ul>
  )
}
