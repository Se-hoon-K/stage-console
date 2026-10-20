export type Show = {
  slug: string
  name: string
  city: string
  venue: string
  date: string
  type: 'Festival' | 'Concert' | 'Launch' | 'Conference'
  capacity: number
  seed: number
  runSheet: { time: string; cue: string }[]
  stats: { label: string; value: number; unit?: string }[]
  images: { src: string; alt: string }[]
  featured: boolean
}

export const shows: Show[] = [
  {
    slug: 'night-signal',
    name: 'Night Signal',
    city: 'Melbourne',
    venue: 'Docklands Yard',
    date: '2026-03-14',
    type: 'Festival',
    capacity: 18000,
    seed: 314,
    runSheet: [
      { time: '16:00', cue: 'Doors' },
      { time: '18:30', cue: 'Act 1' },
      { time: '20:15', cue: 'Act 2' },
      { time: '22:00', cue: 'Headliner' },
      { time: '23:30', cue: 'Curfew' },
    ],
    stats: [
      { label: 'Attendees', value: 18000 },
      { label: 'Crew', value: 212 },
      { label: 'Lights', value: 640 },
      { label: 'Cable', value: 38, unit: 'km' },
    ],
    images: [],
    featured: true,
  },
  {
    slug: 'harbour-lights',
    name: 'Harbour Lights',
    city: 'Sydney',
    venue: 'Barangaroo Reserve',
    date: '2025-12-31',
    type: 'Concert',
    capacity: 24000,
    seed: 1231,
    runSheet: [],
    stats: [],
    images: [],
    featured: false,
  },
  {
    slug: 'low-frequency',
    name: 'Low Frequency',
    city: 'Brisbane',
    venue: 'Riverstage',
    date: '2025-09-20',
    type: 'Festival',
    capacity: 9500,
    seed: 920,
    runSheet: [],
    stats: [],
    images: [],
    featured: false,
  },
  {
    slug: 'ironworks-live',
    name: 'Ironworks Live',
    city: 'Perth',
    venue: 'Fremantle Shed 4',
    date: '2025-06-07',
    type: 'Launch',
    capacity: 1200,
    seed: 607,
    runSheet: [],
    stats: [],
    images: [],
    featured: false,
  },
  {
    slug: 'daybreak-summit',
    name: 'Daybreak Summit',
    city: 'Adelaide',
    venue: 'Convention Hall B',
    date: '2025-04-02',
    type: 'Conference',
    capacity: 3000,
    seed: 402,
    runSheet: [],
    stats: [],
    images: [],
    featured: false,
  },
]
