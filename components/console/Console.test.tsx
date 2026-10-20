import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { consoleStore } from '@/console/store'
import { scrollToCue } from '@/lib/scroll'
import { Console } from './Console'

vi.mock('@/lib/scroll', () => ({ scrollToCue: vi.fn(() => true), isGliding: () => false }))
vi.mock('next/navigation', () => ({ usePathname: () => '/' }))
vi.mock('@/console/audio', () => ({ initAudio: vi.fn(), playPad: vi.fn(), playClick: vi.fn(), readLevel: () => 0 }))

describe('Console', () => {
  beforeEach(() => {
    consoleStore.reset()
    vi.mocked(scrollToCue).mockClear()
  })

  it('is a labelled region with five cues and five sliders', () => {
    render(<Console />)
    const region = screen.getByRole('region', { name: 'Show console' })
    expect(within(region).getAllByRole('button', { name: /^CUE/ })).toHaveLength(5)
    expect(within(region).getAllByRole('slider')).toHaveLength(5)
  })

  it('fader writes to the store and announces a unit', () => {
    render(<Console />)
    const master = screen.getByRole('slider', { name: 'Master' })
    fireEvent.change(master, { target: { value: '0.5' } })
    expect(consoleStore.get().master).toBe(0.5)
    expect(master).toHaveAttribute('aria-valuetext', '50%')
  })

  it('knob steps by detents from the keyboard and stops at its ends', () => {
    render(<Console />)
    const tempo = screen.getByRole('slider', { name: 'Tempo' })
    fireEvent.keyDown(tempo, { key: 'ArrowUp' })
    expect(tempo).toHaveAttribute('aria-valuenow', '130')
    fireEvent.keyDown(tempo, { key: 'ArrowUp', shiftKey: true })
    expect(tempo).toHaveAttribute('aria-valuenow', '180')
    fireEvent.keyDown(tempo, { key: 'ArrowUp' })
    expect(tempo).toHaveAttribute('aria-valuenow', '180')
    fireEvent.keyDown(tempo, { key: 'Home' })
    expect(tempo).toHaveAttribute('aria-valuenow', '60')
    expect(tempo).toHaveAttribute('aria-valuetext', '60 BPM')
  })

  it('double-click resets a knob to its default', () => {
    render(<Console />)
    const fog = screen.getByRole('slider', { name: 'Fog' })
    fireEvent.keyDown(fog, { key: 'End' })
    fireEvent.doubleClick(fog)
    expect(consoleStore.get().fog).toBe(0.3)
  })

  it('marks the active cue and jumps on click', () => {
    render(<Console />)
    act(() => consoleStore.setValue('activeCue', 3))
    expect(screen.getByRole('button', { name: /CUE 03/ })).toHaveAttribute('aria-current', 'true')
    fireEvent.click(screen.getByRole('button', { name: /CUE 05/ }))
    expect(scrollToCue).toHaveBeenCalledWith(5)
    expect(consoleStore.get().activeCue).toBe(5)
  })

  it('does not change the active cue when the scroll fails', () => {
    vi.mocked(scrollToCue).mockReturnValueOnce(false)
    render(<Console />)
    act(() => consoleStore.setValue('activeCue', 3))
    fireEvent.click(screen.getByRole('button', { name: /CUE 05/ }))
    expect(consoleStore.get().activeCue).toBe(3)
  })

  it('accumulates small wheel deltas into one detent per 50px', () => {
    render(<Console />)
    const tempo = screen.getByRole('slider', { name: 'Tempo' })
    const wheel = () => act(() => void tempo.dispatchEvent(new WheelEvent('wheel', { deltaY: -10, bubbles: true, cancelable: true })))
    for (let i = 0; i < 4; i++) wheel()
    expect(tempo).toHaveAttribute('aria-valuenow', '120')
    wheel()
    wheel()
    expect(tempo).toHaveAttribute('aria-valuenow', '130')
  })
})
