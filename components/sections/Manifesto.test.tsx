import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Manifesto } from './Manifesto'

vi.mock('@/lib/gsap')

const lines = ['We are the people behind the lights.', 'Every cable, engineered.', 'Timed to the frame.', 'It all just works.']

describe('Manifesto', () => {
  it('splits the lines into statement, body and kicker', () => {
    const { container } = render(<Manifesto lines={lines} />)
    expect(container.querySelector('.manifesto')).toHaveTextContent(lines[0])
    expect(container.querySelector('.manifesto-body')).toHaveTextContent('Every cable, engineered. Timed to the frame.')
    expect(container.querySelector('.manifesto-kicker')).toHaveTextContent(lines[3])
  })

  it('copes with a single line', () => {
    const { container } = render(<Manifesto lines={[lines[0]]} />)
    expect(container.querySelector('.manifesto')).toHaveTextContent(lines[0])
    expect(container.querySelector('.manifesto-body')).toBeNull()
    expect(container.querySelector('.manifesto-kicker')).toBeNull()
  })
})
