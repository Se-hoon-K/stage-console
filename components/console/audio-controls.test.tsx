import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { initAudio, playPad } from '@/console/audio'
import { consoleStore } from '@/console/store'
import { Pad } from './Pad'
import { SoundToggle } from './SoundToggle'

vi.mock('@/console/audio', () => ({
  initAudio: vi.fn(),
  playPad: vi.fn(),
  playClick: vi.fn(),
  readLevel: () => 0,
}))

describe('audio controls', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    consoleStore.reset()
  })

  it('turns sound on only after audio has started', async () => {
    vi.mocked(initAudio).mockResolvedValue(true)
    render(<SoundToggle />)
    const button = screen.getByRole('button', { name: /sound/i })
    expect(button).toHaveAttribute('aria-pressed', 'false')
    fireEvent.click(button)
    await waitFor(() => expect(button).toHaveAttribute('aria-pressed', 'true'))
    expect(consoleStore.get().soundOn).toBe(true)
  })

  it('disables itself and stays off when audio is unsupported', async () => {
    vi.mocked(initAudio).mockResolvedValue(false)
    render(<SoundToggle />)
    const button = screen.getByRole('button', { name: /sound/i })
    fireEvent.click(button)
    await waitFor(() => expect(button).toBeDisabled())
    expect(button).toHaveTextContent(/no audio/i)
    expect(consoleStore.get().soundOn).toBe(false)
  })

  it('fires a pad once per key press, ignoring auto-repeat', () => {
    render(<Pad kind="kick" label="Kick" />)
    const pad = screen.getByRole('button', { name: 'Kick' })
    fireEvent.keyDown(pad, { key: 'Enter' })
    expect(fireEvent.keyDown(pad, { key: 'Enter', repeat: true })).toBe(false)
    expect(fireEvent.keyDown(pad, { key: 'Enter', repeat: true })).toBe(false)
    expect(fireEvent.keyDown(pad, { key: ' ', repeat: true })).toBe(false)
    expect(fireEvent.keyUp(pad, { key: ' ' })).toBe(false)
    expect(playPad).toHaveBeenCalledTimes(1)
    expect(playPad).toHaveBeenCalledWith('kick')
  })

  it('fires a pad on pointer down', () => {
    render(<Pad kind="drop" label="Drop" />)
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Drop' }), { button: 0 })
    expect(playPad).toHaveBeenCalledWith('drop')
  })

  it('fires a pad on a bare click (assistive tech)', () => {
    render(<Pad kind="hit" label="Hit" />)
    fireEvent.click(screen.getByRole('button', { name: 'Hit' }))
    expect(playPad).toHaveBeenCalledTimes(1)
  })

  it('does not double-fire on pointer down followed by its click', () => {
    render(<Pad kind="hit" label="Hit" />)
    const pad = screen.getByRole('button', { name: 'Hit' })
    fireEvent.pointerDown(pad, { button: 0 })
    fireEvent.click(pad, { detail: 1 })
    expect(playPad).toHaveBeenCalledTimes(1)
  })

  it('ignores non-primary pointer buttons', () => {
    render(<Pad kind="hit" label="Hit" />)
    fireEvent.pointerDown(screen.getByRole('button', { name: 'Hit' }), { button: 2 })
    expect(playPad).not.toHaveBeenCalled()
  })
})
