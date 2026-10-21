'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentProps, MouseEvent } from 'react'
import { closeShutter } from '@/lib/transition'

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string }

/** Link that drops the shutter before navigating. Modified clicks and same-page anchors keep browser defaults. */
export function TransitionLink({ href, onClick, target, ...rest }: Props) {
  const router = useRouter()

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || target === '_blank') return
    const url = new URL(href, window.location.href)
    if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return
    e.preventDefault()
    void closeShutter().then(() => router.push(href))
  }

  return <Link href={href} target={target} onClick={handle} {...rest} />
}
