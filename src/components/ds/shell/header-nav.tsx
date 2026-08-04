'use client'

import Link from 'next/link'

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import type { NavItem, NavLink } from '@/lib/nav/types'

import { NavAction } from './nav-action'
import { NavIcon } from './nav-icon'

function MenuLink({ link }: { link: NavLink }) {
  return (
    <NavigationMenuLink
      render={
        <Link href={link.href} className="flex gap-3 rounded-md p-3 hover:bg-accent">
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
  return (
    <NavigationMenu className="hidden md:flex">
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
                        <MenuLink link={link} />
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
                    className="inline-flex h-9 items-center rounded-md px-3 text-sm font-medium hover:bg-accent"
                  >
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
