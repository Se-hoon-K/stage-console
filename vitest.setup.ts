import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

afterEach(() => cleanup())

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Element.prototype.scrollIntoView = vi.fn()

vi.mock('next/link', async () => {
  const { createElement } = await import('react')
  const nextOnly = ['prefetch', 'replace', 'scroll', 'shallow', 'passHref', 'legacyBehavior', 'locale']
  return {
    default: ({ href, children, ...rest }: { href: string; children?: unknown } & Record<string, unknown>) => {
      for (const k of nextOnly) delete rest[k] // Next-only props must not reach the DOM <a>
      return createElement('a', { href, ...rest }, children as never)
    },
  }
})
