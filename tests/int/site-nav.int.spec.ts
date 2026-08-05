import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { getPayload } from 'payload'
import { describe, it, expect, vi, afterAll } from 'vitest'

import { siteNav } from '@/config/site-nav'
import { Navigation, type StoredNavigation } from '@/globals/Navigation'
import { currentProps } from '@/lib/nav/link'
import { isUsableNavigation, loadNavigation } from '@/lib/navigation'
import config from '@/payload.config'
import { ICON_NAMES } from '@/lib/icons'
import {
  NAV_ACTIONS,
  actionRegistry,
  isActionName,
  runAction,
  type ActionContext,
} from '@/lib/nav/actions'
import { navLinksOf, type NavItem } from '@/lib/nav/types'
import { mapNavigation } from '@/mappers/navigation'

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

describe('every configured destination', () => {
  const PLACEHOLDER_ROUTES = ['/signup', '/docs', '/contact', '/privacy', '/terms']

  function routesUnderApp(): string[] {
    const appDir = join(process.cwd(), 'src/app')

    const walk = (dir: string, segments: string[]): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) {
          if (entry.name.startsWith('[[')) return walk(full, segments)
          if (entry.name.startsWith('[')) return []
          const isGroup = entry.name.startsWith('(') && entry.name.endsWith(')')
          return walk(full, isGroup ? segments : [...segments, entry.name])
        }
        return /^page\.tsx?$/.test(entry.name)
          ? [`/${segments.join('/')}`.replace(/\/$/, '') || '/']
          : []
      })

    return walk(appDir, [])
  }

  const internalHrefs = [
    ...siteNav.header.items.flatMap(navLinksOf),
    ...(siteNav.header.cta ? [siteNav.header.cta] : []),
    ...siteNav.footer.columns.flatMap((column) => column.items),
    ...(siteNav.footer.legal ?? []),
    siteNav.brand,
  ]
    .map((link) => link.href)
    .filter((href) => href.startsWith('/'))

  it('reads a non-empty route list, so the check is not vacuous', () => {
    const routes = routesUnderApp()

    expect(routes).toContain('/')
    expect(routes).toContain('/dashboard')
  })

  it('either resolves to a route or is a declared placeholder', () => {
    const routes = routesUnderApp()
    const unaccounted = internalHrefs.filter(
      (href) => !routes.includes(href) && !PLACEHOLDER_ROUTES.includes(href),
    )

    expect(unaccounted).toEqual([])
  })

  it('declares no placeholder that has since become a real route', () => {
    const routes = routesUnderApp()
    const stale = PLACEHOLDER_ROUTES.filter((href) => routes.includes(href))

    expect(stale).toEqual([])
  })

  it('lists no placeholder that nothing links to', () => {
    const unused = PLACEHOLDER_ROUTES.filter((href) => !internalHrefs.includes(href))

    expect(unused).toEqual([])
  })
})

describe('navigation mapper', () => {
  const storedNavigation: StoredNavigation = {
    brand: { label: 'Tempify', href: '/' },
    header: {
      items: [
        {
          kind: 'menu' as const,
          label: 'Product',
          items: [
            {
              label: 'Landing page',
              href: '/',
              description: 'Sections composed from typed Presets, rendered on the server.',
              icon: 'layers',
            },
            {
              label: 'Dashboard',
              href: '/dashboard',
              description: 'Sidebar, cards and a data table assembled from shadcn blocks.',
              icon: 'gauge',
            },
            {
              label: 'Charts',
              href: '/dashboard/charts',
              description: 'Recharts wrappers reading the same semantic tokens as everything else.',
              icon: 'chart',
            },
          ],
        },
        { kind: 'link' as const, label: 'Admin', href: '/admin' },
        {
          kind: 'action' as const,
          label: 'Toggle theme',
          action: 'toggleTheme',
          actionIcon: 'sparkles',
        },
      ],
      cta: { label: 'Start free trial', href: '/signup' },
    },
    sidebar: { groups: [{ items: [{ label: 'Overview', href: '/dashboard' }] }] },
    footer: {
      tagline: 'A Payload and Next.js template where pages are typed configuration, not markup.',
      columns: [
        {
          title: 'Product',
          items: [
            { label: 'Overview', href: '/' },
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'Charts', href: '/dashboard/charts' },
          ],
        },
        {
          title: 'Company',
          items: [
            { label: 'Contact', href: '/contact' },
            { label: 'Community', href: 'https://discord.gg', external: true },
          ],
        },
      ],
      copyright: '© 2026 Tempify. All rights reserved.',
      legal: [
        { label: 'Privacy', href: '/privacy' },
        { label: 'Terms', href: '/terms' },
      ],
    },
  }

  it('maps a stored global to the typed LayoutConfig', () => {
    const { config, warnings } = mapNavigation(storedNavigation)

    expect(warnings).toEqual([])
    expect(config.brand).toEqual({ label: 'Tempify', href: '/' })
    expect(config.header.items).toHaveLength(3)
    expect(config.header.items[0]).toEqual({
      type: 'menu',
      label: 'Product',
      items: [
        {
          label: 'Landing page',
          href: '/',
          description: 'Sections composed from typed Presets, rendered on the server.',
          icon: 'layers',
          external: false,
        },
        {
          label: 'Dashboard',
          href: '/dashboard',
          description: 'Sidebar, cards and a data table assembled from shadcn blocks.',
          icon: 'gauge',
          external: false,
        },
        {
          label: 'Charts',
          href: '/dashboard/charts',
          description: 'Recharts wrappers reading the same semantic tokens as everything else.',
          icon: 'chart',
          external: false,
        },
      ],
    })
    expect(config.header.items[2]).toEqual({
      type: 'action',
      label: 'Toggle theme',
      action: 'toggleTheme',
      icon: 'sparkles',
    })
    expect(config.footer.columns).toHaveLength(2)
    expect(config.footer.legal).toHaveLength(2)
  })

  it('drops an unknown header kind and warns', () => {
    const { config, warnings } = mapNavigation({
      ...storedNavigation,
      header: {
        ...storedNavigation.header,
        items: [{ kind: 'mega', label: 'Mega' }],
      },
    } as unknown as StoredNavigation)

    expect(config.header.items).toEqual([])
    expect(warnings.some((w) => w.includes('unknown kind'))).toBe(true)
  })

  it('drops an action with an unknown action name and warns', () => {
    const { config, warnings } = mapNavigation({
      ...storedNavigation,
      header: {
        ...storedNavigation.header,
        items: [{ kind: 'action', label: 'Do it', action: 'unknownAction' }],
      },
    } as unknown as StoredNavigation)

    expect(config.header.items).toEqual([])
    expect(warnings.some((w) => w.includes('unknown action'))).toBe(true)
  })

  it('drops an unknown icon from a link but keeps the link', () => {
    const { config, warnings } = mapNavigation({
      ...storedNavigation,
      header: {
        ...storedNavigation.header,
        items: [{ kind: 'link', label: 'Admin', href: '/admin', icon: 'notAnIcon' }],
      },
    } as unknown as StoredNavigation)

    expect(config.header.items).toEqual([
      { type: 'link', label: 'Admin', href: '/admin', external: false },
    ])
    expect(warnings.some((w) => w.includes('notAnIcon'))).toBe(true)
  })

  it('drops a menu with no valid items and warns', () => {
    const { config, warnings } = mapNavigation({
      ...storedNavigation,
      header: {
        ...storedNavigation.header,
        items: [{ kind: 'menu', label: 'Empty', items: [{ label: '', href: '' }] }],
      },
    } as unknown as StoredNavigation)

    expect(config.header.items).toEqual([])
    expect(warnings.some((w) => w.includes('no valid items'))).toBe(true)
  })

  it('drops a footer column with no valid items and warns', () => {
    const { config, warnings } = mapNavigation({
      ...storedNavigation,
      footer: {
        ...storedNavigation.footer,
        columns: [{ title: 'Empty', items: [{ label: '', href: '' }] }],
      },
    } as unknown as StoredNavigation)

    expect(config.footer.columns).toEqual([])
    expect(warnings.some((w) => w.includes('no valid items'))).toBe(true)
  })

  it('falls back to a default brand and copyright when they are missing', () => {
    const { config, warnings } = mapNavigation({
      header: { items: [] },
      footer: { columns: [] },
    } as unknown as StoredNavigation)

    expect(config.brand).toEqual({ label: 'Tempify', href: '/' })
    expect(config.footer.copyright).toBe('')
    expect(warnings.length).toBeGreaterThan(0)
  })
})

describe('Navigation global access', () => {
  it('allows public read access', () => {
    expect(Navigation.access!.read!({ req: { user: null } } as never)).toBe(true)
  })

  it('denies unauthenticated update', () => {
    expect(Navigation.access!.update!({ req: { user: null } } as never)).toBe(false)
  })

  it('allows authenticated update', () => {
    expect(
      Navigation.access!.update!({ req: { user: { id: '1', email: 'a@b.com' } } } as never),
    ).toBe(true)
  })
})

describe('loadNavigation', () => {
  it('falls back to the TypeScript fixture when no global document exists', async () => {
    const { Client } = await import('pg')
    const client = new Client({ connectionString: process.env.DATABASE_URL })
    await client.connect()
    await client.query('DELETE FROM navigation')
    await client.end()

    const nav = await loadNavigation()

    expect(nav).toEqual(siteNav)
  })
})

async function clearStoredNavigation() {
  const payload = await getPayload({ config: await config })
  await payload.db.drizzle.execute('DELETE FROM navigation')
}

describe('navigation an editor can save never empties the site header', () => {
  afterAll(clearStoredNavigation)

  const base = {
    brand: { label: 'Tempify', href: '/' },
    sidebar: { groups: [{ items: [{ label: 'Overview', href: '/dashboard' }] }] },
    footer: {
      columns: [{ title: 'Info', items: [{ label: 'About', href: '/about' }] }],
      copyright: '© 2026',
    },
  }

  const incoherent = [
    ['a menu with no sub-items', { kind: 'menu', label: 'Product' }],
    ['a link with no destination', { kind: 'link', label: 'Pricing' }],
    ['an action with no action', { kind: 'action', label: 'Toggle' }],
  ] as const

  it('refuses to store a header item that its kind cannot satisfy', async () => {
    const payload = await getPayload({ config: await config })

    for (const [name, item] of incoherent) {
      await expect(
        payload.updateGlobal({
          slug: 'navigation',
          data: { ...base, header: { items: [item] } } as never,
          overrideAccess: true,
        }),
        name,
      ).rejects.toThrow()
    }
  })

  it('stores a header item its kind can satisfy', async () => {
    const payload = await getPayload({ config: await config })

    await expect(
      payload.updateGlobal({
        slug: 'navigation',
        data: {
          ...base,
          header: { items: [{ kind: 'link', label: 'Admin', href: '/admin' }] },
        } as never,
        overrideAccess: true,
      }),
    ).resolves.toBeTruthy()
  })

  it('falls back to the fixture rather than rendering a header with nothing in it', async () => {
    const { config: mapped } = mapNavigation({
      ...base,
      header: { items: [{ kind: 'menu', label: 'Product' }] },
    } as never)

    expect(mapped.header.items).toHaveLength(0)
  })
})

describe('the sidebar comes from configuration', () => {
  const base = {
    brand: { label: 'Tempify', href: '/' },
    header: { items: [{ kind: 'link', label: 'Admin', href: '/admin' }] },
    footer: {
      columns: [{ title: 'Info', items: [{ label: 'About', href: '/about' }] }],
      copyright: '© 2026',
    },
  }

  it('maps stored sidebar groups, keeping order and icons', () => {
    const { config: mapped } = mapNavigation({
      ...base,
      sidebar: {
        groups: [
          { items: [{ label: 'Overview', href: '/dashboard', icon: 'gauge' }] },
          { title: 'Content', items: [{ label: 'Pages', href: '/admin/collections/pages' }] },
        ],
      },
    } as never)

    expect(mapped.sidebar.groups).toHaveLength(2)
    expect(mapped.sidebar.groups[0]!.title).toBeUndefined()
    expect(mapped.sidebar.groups[0]!.items[0]).toMatchObject({ href: '/dashboard', icon: 'gauge' })
    expect(mapped.sidebar.groups[1]!.title).toBe('Content')
  })

  it('drops a group whose every item is unusable, and says so', () => {
    const { config: mapped, warnings } = mapNavigation({
      ...base,
      sidebar: { groups: [{ title: 'Broken', items: [{ label: 'No href', href: '' }] }] },
    } as never)

    expect(mapped.sidebar.groups).toHaveLength(0)
    expect(warnings.join(' ')).toContain('Broken')
  })

  it('keeps two labels pointing at the same destination, which is legitimate', () => {
    const { config: mapped } = mapNavigation({
      ...base,
      sidebar: {
        groups: [
          {
            items: [
              { label: 'Documentation', href: '/docs' },
              { label: 'API reference', href: '/docs' },
            ],
          },
        ],
      },
    } as never)

    expect(mapped.sidebar.groups[0]!.items.map((i) => i.label)).toEqual([
      'Documentation',
      'API reference',
    ])
  })

  it('carries a badge an editor set, rather than discarding it', () => {
    const { config: mapped } = mapNavigation({
      ...base,
      sidebar: {
        groups: [{ items: [{ label: 'Inbox', href: '/dashboard', badge: '3' }] }],
      },
    } as never)

    expect(mapped.sidebar.groups[0]!.items[0]).toMatchObject({ label: 'Inbox', badge: '3' })
  })

  it('refuses a stored global with no sidebar groups, so a dashboard is never unnavigable', async () => {
    const payload = await getPayload({ config: await config })

    await expect(
      payload.updateGlobal({
        slug: 'navigation',
        data: {
          brand: { label: 'Stored', href: '/' },
          header: { items: [{ kind: 'link', label: 'Admin', href: '/admin' }] },
          sidebar: { groups: [] },
          footer: {
            columns: [{ title: 'Info', items: [{ label: 'About', href: '/about' }] }],
            copyright: '© 2026',
          },
        } as never,
        overrideAccess: true,
      }),
    ).rejects.toThrow()
  })

  it('stays quiet about a call to action an editor never filled in', () => {
    const { warnings } = mapNavigation({
      ...base,
      sidebar: { groups: [{ items: [{ label: 'Overview', href: '/dashboard' }] }] },
    } as never)

    expect(warnings.join(' ')).not.toMatch(/call to action/i)
  })
})

describe('marking the current page', () => {
  it('marks only the page itself, never its parent section', () => {
    expect(currentProps('/dashboard/charts', '/dashboard/charts')).toMatchObject({
      'aria-current': 'page',
    })
    expect(currentProps('/dashboard', '/dashboard/charts')['aria-current']).toBeUndefined()
  })

  it('still marks the parent section active for styling', () => {
    expect(currentProps('/dashboard', '/dashboard/charts')['data-active']).toBe(true)
  })

  it('never marks an off-site or anchor destination', () => {
    expect(currentProps('https://example.com', '/')).toEqual({})
    expect(currentProps('#top', '/')).toEqual({})
  })
})

describe('a global that predates the sidebar field', () => {
  it('falls back to the fixture rather than rendering a dashboard with no navigation', () => {
    const { config: mapped } = mapNavigation({
      brand: { label: 'Stored', href: '/' },
      header: { items: [{ kind: 'link', label: 'Admin', href: '/admin' }] },
      footer: {
        columns: [{ title: 'Info', items: [{ label: 'About', href: '/about' }] }],
        copyright: '© 2026',
      },
    } as never)

    // no sidebar key at all, exactly as a row written before this field existed
    expect(mapped.sidebar.groups).toHaveLength(0)
    expect(
      isUsableNavigation(mapped),
      'a mapped config with no sidebar groups must be treated as unusable, or an existing stored global leaves the dashboard unnavigable',
    ).toBe(false)
  })
})
