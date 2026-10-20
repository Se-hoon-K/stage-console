import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { consoleStore } from '@/console/store'
import { ConsoleCssVars } from './ConsoleCssVars'

beforeEach(() => consoleStore.reset())
afterEach(() => {
  document.documentElement.style.removeProperty('--master')
  document.documentElement.style.removeProperty('--hue')
})

it('mirrors master and hue onto <html> as CSS variables', () => {
  render(<ConsoleCssVars />)
  const style = document.documentElement.style
  expect(style.getPropertyValue('--master')).toBe('0.8')
  expect(style.getPropertyValue('--hue')).toBe('8')
  act(() => consoleStore.set({ master: 0.25, hue: 200 }))
  expect(style.getPropertyValue('--master')).toBe('0.25')
  expect(style.getPropertyValue('--hue')).toBe('200')
})
