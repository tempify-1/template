'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { NavIcon } from '@/components/ds/shell/nav-icon'
import { SidebarMenuButton } from '@/components/ui/sidebar'
import { currentProps, externalProps } from '@/lib/nav/link'
import type { SidebarItem } from '@/lib/nav/types'

export function SidebarLink({ item }: { item: SidebarItem }) {
  const pathname = usePathname()

  return (
    <SidebarMenuButton
      render={
        <Link href={item.href} {...externalProps(item)} {...currentProps(item.href, pathname)}>
          <NavIcon name={item.icon} className="size-4" />
          <span>{item.label}</span>
        </Link>
      }
    />
  )
}
