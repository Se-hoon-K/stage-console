'use client'

import { useEffect } from 'react'
import { consoleStore } from '@/console/store'

/** Exposes console values to CSS so typography can react without React re-renders. */
export function ConsoleCssVars() {
  useEffect(() => {
    const apply = () => {
      const { master, hue } = consoleStore.get()
      const style = document.documentElement.style
      style.setProperty('--master', String(master))
      style.setProperty('--hue', String(hue))
    }
    apply()
    return consoleStore.subscribe(apply)
  }, [])
  return null
}
