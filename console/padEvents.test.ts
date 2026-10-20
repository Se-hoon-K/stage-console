import { expect, it, vi } from 'vitest'
import { emitPadHit, onPadHit } from './padEvents'

it('delivers pad hits to listeners until they unsubscribe', () => {
  const fn = vi.fn()
  const off = onPadHit(fn)
  emitPadHit('kick')
  expect(fn).toHaveBeenCalledWith('kick')
  off()
  emitPadHit('drop')
  expect(fn).toHaveBeenCalledTimes(1)
})
