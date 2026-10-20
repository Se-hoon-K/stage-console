import { vi } from 'vitest'

const context = { revert: vi.fn(), add: vi.fn() }

export const gsap = {
  context: vi.fn((fn: () => void) => {
    fn()
    return context
  }),
  from: vi.fn(),
  to: vi.fn(),
  fromTo: vi.fn(),
  set: vi.fn(),
  ticker: { add: vi.fn(), remove: vi.fn(), lagSmoothing: vi.fn() },
}

export const ScrollTrigger = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- param types the recorded call args
  create: vi.fn((_config?: unknown) => ({ progress: 0, kill: vi.fn() })),
  update: vi.fn(),
  refresh: vi.fn(),
}

export const SplitText = {
  create: vi.fn(() => ({ chars: [], words: [], lines: [], revert: vi.fn() })),
}
