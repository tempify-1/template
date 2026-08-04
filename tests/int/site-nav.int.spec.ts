import { describe, it, expect, vi } from 'vitest'

import { siteNav } from '@/config/site-nav'
import { ICON_NAMES } from '@/lib/icons'
import {
  NAV_ACTIONS,
  actionRegistry,
  isActionName,
  runAction,
  type ActionContext,
} from '@/lib/nav/actions'
import { navLinksOf, type NavItem } from '@/lib/nav/types'

function themeContext(resolved: string | undefined): {
  context: ActionContext
  set: ReturnType<typeof vi.fn>
} {
  const set = vi.fn()
  return { context: { theme: { resolved, set } }, set }
}

describe('the Action registry', () => {
  it('resolves every declared Action to a function', () => {
    for (const name of NAV_ACTIONS) {
      expect(typeof actionRegistry[name], name).toBe('function')
    }
  })

  it('registers no Action that is not in the declared union', () => {
    expect(Object.keys(actionRegistry).sort()).toEqual([...NAV_ACTIONS].sort())
  })

  it('rejects a name outside the union rather than resolving it', () => {
    for (const name of ['signOut', '', 'toggletheme', 'constructor', '__proto__']) {
      expect(isActionName(name), name).toBe(false)
    }
  })

  it('turns the light theme dark and back, reading the resolved theme', () => {
    const fromLight = themeContext('light')
    runAction('toggleTheme', fromLight.context)
    expect(fromLight.set).toHaveBeenCalledWith('dark')

    const fromDark = themeContext('dark')
    runAction('toggleTheme', fromDark.context)
    expect(fromDark.set).toHaveBeenCalledWith('light')
  })

  it('treats an unresolved theme as light rather than doing nothing', () => {
    const { context, set } = themeContext(undefined)
    runAction('toggleTheme', context)

    expect(set).toHaveBeenCalledWith('dark')
  })
})

describe('the site navigation config', () => {
  const headerItems = siteNav.header.items

  it('names an Action the registry can resolve, never a function', () => {
    const actions = headerItems.filter((item) => item.type === 'action')

    expect(actions.length).toBeGreaterThan(0)
    for (const item of actions) {
      expect(isActionName(item.action), item.label).toBe(true)
      expect(typeof item.action).toBe('string')
    }
  })

  it('survives JSON serialization unchanged, so it could be stored by Payload', () => {
    expect(JSON.parse(JSON.stringify(siteNav))).toEqual(siteNav)
  })

  it('carries at least one dropdown, since a flat bar would not exercise the menu variant', () => {
    const menus = headerItems.filter((item) => item.type === 'menu')

    expect(menus.length).toBeGreaterThan(0)
    for (const menu of menus) expect(menu.items.length).toBeGreaterThan(1)
  })

  it('names only icons the lookup map can resolve', () => {
    const icons = [
      ...headerItems.flatMap((item) => ('icon' in item && item.icon ? [item.icon] : [])),
      ...headerItems.flatMap((item) => navLinksOf(item).flatMap((l) => (l.icon ? [l.icon] : []))),
    ]

    for (const icon of icons) expect(ICON_NAMES).toContain(icon)
  })

  it('gives every link a non-empty label and href', () => {
    const links = [
      ...headerItems.flatMap(navLinksOf),
      ...(siteNav.header.cta ? [siteNav.header.cta] : []),
      ...siteNav.footer.columns.flatMap((column) => column.items),
      ...(siteNav.footer.legal ?? []),
    ]

    for (const link of links) {
      expect(link.label.trim(), JSON.stringify(link)).not.toBe('')
      expect(link.href.trim(), JSON.stringify(link)).not.toBe('')
    }
  })

  it('marks an off-site link external so the renderer can add rel and target', () => {
    const offSite = siteNav.footer.columns
      .flatMap((column) => column.items)
      .filter((link) => link.href.startsWith('http'))

    expect(offSite.length).toBeGreaterThan(0)
    for (const link of offSite) expect(link.external, link.href).toBe(true)
  })

  it('drives the footer from the same link shape as the header', () => {
    const footerLinks = siteNav.footer.columns.flatMap((column) => column.items)

    for (const link of footerLinks) {
      expect(
        Object.keys(link).every((key) =>
          ['label', 'href', 'icon', 'description', 'external'].includes(key),
        ),
      ).toBe(true)
    }
  })
})

describe('navLinksOf', () => {
  it('flattens a menu into its links and a link into itself', () => {
    const menu: NavItem = {
      type: 'menu',
      label: 'Product',
      items: [
        { label: 'A', href: '/a' },
        { label: 'B', href: '/b' },
      ],
    }
    const link: NavItem = { type: 'link', label: 'Admin', href: '/admin' }

    expect(navLinksOf(menu).map((l) => l.href)).toEqual(['/a', '/b'])
    expect(navLinksOf(link).map((l) => l.href)).toEqual(['/admin'])
  })

  it('yields nothing for an Action, since it has no destination', () => {
    expect(navLinksOf({ type: 'action', label: 'Toggle theme', action: 'toggleTheme' })).toEqual([])
  })
})
