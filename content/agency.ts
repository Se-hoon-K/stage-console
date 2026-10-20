export type Service = { id: string; title: string; summary: string; details: string[] }

export type Credits = { author: string; github: string; repo: string; linkedin?: string }

export const agency: {
  name: string
  tagline: string
  manifesto: string[]
  services: Service[]
  email: string
  city: string
  credits: Credits
} = {
  name: '[AGENCY]',
  tagline: 'We build the show.',
  manifesto: [
    'We are the people behind the lights.',
    'Every cable, cue and curfew, engineered.',
    'Rigged for thousands. Timed to the frame.',
    'When the house lights drop, it all just works.',
  ],
  services: [
    {
      id: 'production',
      title: 'Production',
      summary: 'End-to-end show delivery, from site plan to load-out.',
      details: ['Site and venue planning', 'Run sheets and show calling', 'Crew and vendor management'],
    },
    {
      id: 'stage-light',
      title: 'Stage & Light Design',
      summary: 'Structures and light rigs designed around the moment.',
      details: ['Stage and truss design', 'Lighting design and programming', 'Pre-visualisation'],
    },
    {
      id: 'sound',
      title: 'Sound',
      summary: 'Systems tuned for every seat in the house.',
      details: ['PA design and tuning', 'Monitor engineering', 'Noise compliance'],
    },
    {
      id: 'experience',
      title: 'Experience Design',
      summary: 'Everything the audience touches between the gates and the stage.',
      details: ['Wayfinding and signage', 'Interactive installations', 'Accessibility planning'],
    },
  ],
  email: 'hello@example.com',
  city: 'Melbourne',
  credits: {
    author: 'Sehoon Ko',
    github: 'https://github.com/Se-hoon-K',
    repo: 'https://github.com/Se-hoon-K/stage-console',
    linkedin: undefined,
  },
}
