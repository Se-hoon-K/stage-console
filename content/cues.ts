export const CUES = [
  { n: 1, label: 'Show', title: 'We build the show.' },
  { n: 2, label: 'Manifesto', title: 'Manifesto' },
  { n: 3, label: 'Work', title: 'Selected shows' },
  { n: 4, label: 'Services', title: 'Services' },
  { n: 5, label: 'Contact', title: 'Book a show' },
] as const

export type CueNumber = (typeof CUES)[number]['n']

export const cueLabel = (n: number) => `CUE ${String(n).padStart(2, '0')}`
