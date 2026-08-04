'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { currentProps, externalProps } from '@/lib/nav/link'
import type { NavLink } from '@/lib/nav/types'

export function FooterLink({ link, className }: { link: NavLink; className?: string }) {
  const pathname = usePathname()

  return (
    <Link
      href={link.href}
      className={className}
      {...externalProps(link)}
      {...currentProps(link.href, pathname)}
    >
      {link.label}
    </Link>
  )
}
