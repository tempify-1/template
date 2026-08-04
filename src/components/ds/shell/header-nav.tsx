'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { currentProps, externalProps } from '@/lib/nav/link'
import type { NavItem, NavLink } from '@/lib/nav/types'

import { NavAction } from './nav-action'
import { NavIcon } from './nav-icon'

function MenuLink({ link, pathname }: { link: NavLink; pathname: string }) {
  return (
    <NavigationMenuLink
      render={
        <Link
          href={link.href}
          className="flex gap-3 rounded-md p-3 hover:bg-accent"
          {...externalProps(link)}
          {...currentProps(link.href, pathname)}
        >
          <NavIcon name={link.icon} className="mt-0.5 size-4 shrink-0" />
          <span className="flex flex-col gap-1">
            <span className="text-sm font-medium leading-none">{link.label}</span>
            {link.description ? (
              <span className="text-sm leading-snug text-muted-foreground">{link.description}</span>
            ) : null}
          </span>
        </Link>
      }
    />
  )
}

export function HeaderNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <NavigationMenu className="hidden md:flex" aria-label="Site">
      <NavigationMenuList>
        {items.map((item) => {
          if (item.type === 'menu') {
            return (
              <NavigationMenuItem key={item.label}>
                <NavigationMenuTrigger>{item.label}</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[26rem] gap-1 p-2">
                    {item.items.map((link) => (
                      <li key={link.href}>
                        <MenuLink link={link} pathname={pathname} />
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            )
          }

          if (item.type === 'action') {
            return (
              <NavigationMenuItem key={item.label}>
                <NavAction label={item.label} action={item.action} icon={item.icon} />
              </NavigationMenuItem>
            )
          }

          return (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink
                render={
                  <Link
                    href={item.href}
                    className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium hover:bg-accent"
                    {...externalProps(item)}
                    {...currentProps(item.href, pathname)}
                  >
                    <NavIcon name={item.icon} className="size-4" />
                    {item.label}
                  </Link>
                }
              />
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
