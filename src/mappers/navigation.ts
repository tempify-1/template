import type { StoredNavigation } from '@/globals/Navigation'
import { isIconName, type IconName } from '@/lib/icons'
import { isActionName } from '@/lib/nav/actions'
import type { LayoutConfig, NavItem, NavLink, SidebarGroup } from '@/lib/nav/types'

function sanitizeIcon(
  name: string | null | undefined,
  context: string,
  warn: (message: string) => void,
): IconName | undefined {
  if (!name) return undefined
  if (!isIconName(name)) {
    warn(`Dropped unknown icon "${name}" from ${context}`)
    return undefined
  }
  return name
}

function filled(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function toNavLink(raw: unknown, warn: (message: string) => void): NavLink | undefined {
  const row = raw as
    Partial<StoredNavigation['footer']['columns'][number]['items'][number]> | null | undefined
  if (!row) return undefined

  if (!filled(row.label) || !filled(row.href)) {
    warn(`Dropped link: missing label or href`)
    return undefined
  }

  const icon = sanitizeIcon(row.icon, `link "${row.label}"`, warn)

  return {
    label: row.label,
    href: row.href,
    description: filled(row.description) ? row.description : undefined,
    icon,
    external: row.external ?? false,
  }
}

function toHeaderItem(raw: unknown, warn: (message: string) => void): NavItem | undefined {
  const row = raw as Partial<StoredNavigation['header']['items'][number]> | null | undefined
  if (!row) return undefined

  const kind = row.kind
  const label = filled(row.label) ? row.label : undefined

  if (kind === 'link') {
    const link = toNavLink(row, warn)
    if (!link) return undefined
    return { type: 'link', ...link }
  }

  if (kind === 'menu') {
    if (!label) {
      warn(`Dropped menu: missing label`)
      return undefined
    }
    const items = (row.items ?? [])
      .map((item) => toNavLink(item, warn))
      .filter((link): link is NavLink => link !== undefined)
    if (items.length === 0) {
      warn(`Dropped menu "${label}": no valid items`)
      return undefined
    }
    return { type: 'menu', label, items }
  }

  if (kind === 'action') {
    if (!label) {
      warn(`Dropped action: missing label`)
      return undefined
    }
    if (!filled(row.action) || !isActionName(row.action)) {
      warn(`Dropped action "${label}": unknown action "${row.action ?? ''}"`)
      return undefined
    }
    const icon = sanitizeIcon(row.actionIcon ?? row.icon, `action "${label}"`, warn)
    return { type: 'action', label, action: row.action, icon }
  }

  warn(`Dropped header item: unknown kind "${String(kind)}"`)
  return undefined
}

function toFooterColumn(
  raw: unknown,
  warn: (message: string) => void,
): LayoutConfig['footer']['columns'][number] | undefined {
  const row = raw as Partial<StoredNavigation['footer']['columns'][number]> | null | undefined
  if (!row) return undefined

  if (!filled(row.title)) {
    warn(`Dropped footer column: missing title`)
    return undefined
  }

  const items = dedupeByHref(
    (row.items ?? [])
      .map((item) => toNavLink(item, warn))
      .filter((link): link is NavLink => link !== undefined),
    warn,
    `footer column "${row.title}"`,
  )
  if (items.length === 0) {
    warn(`Dropped footer column "${row.title}": no valid items`)
    return undefined
  }

  return { title: row.title, items }
}

function toCallToAction(raw: unknown, warn: (message: string) => void): NavLink | undefined {
  const row = raw as Partial<StoredNavigation['header']['cta']> | null | undefined
  if (!row || (!filled(row.label) && !filled(row.href))) return undefined
  const link = toNavLink({ ...row, description: undefined, icon: undefined }, warn)
  return link
}

function toSidebarGroup(raw: unknown, warn: (message: string) => void): SidebarGroup | undefined {
  const row = raw as Partial<SidebarGroup> | null | undefined
  if (!row) return undefined

  const items = dedupeByHref(
    (row.items ?? [])
      .map((item) => toNavLink(item, warn))
      .filter((link): link is NavLink => link !== undefined),
    warn,
    row.title ?? 'sidebar group',
  )

  if (items.length === 0) {
    warn(`Dropped sidebar group "${row.title ?? '(untitled)'}": no valid items`)
    return undefined
  }

  return { title: filled(row.title) ? row.title : undefined, items }
}

function dedupeByHref<T extends { href: string }>(
  links: T[],
  warn: (message: string) => void,
  context: string,
): T[] {
  const seen = new Set<string>()

  return links.filter((link) => {
    if (seen.has(link.href)) {
      warn(`Dropped duplicate destination "${link.href}" in ${context}`)
      return false
    }
    seen.add(link.href)
    return true
  })
}

export interface MapNavigationResult {
  config: LayoutConfig
  warnings: string[]
}

export function mapNavigation(
  stored: Partial<StoredNavigation> | null | undefined,
): MapNavigationResult {
  const warnings: string[] = []
  const warn = (message: string) => warnings.push(message)

  const brandRaw = stored?.brand
  const hasBrand = filled(brandRaw?.label) && filled(brandRaw?.href)
  const brand = hasBrand
    ? { label: brandRaw.label, href: brandRaw.href }
    : { label: 'Tempify', href: '/' }
  if (!hasBrand) {
    warn('Brand missing or incomplete; using fallback brand')
  }

  const headerItems = (stored?.header?.items ?? [])
    .map((item) => toHeaderItem(item, warn))
    .filter((item): item is NavItem => item !== undefined)

  const cta = toCallToAction(stored?.header?.cta, warn)

  const footerColumns = (stored?.footer?.columns ?? [])
    .map((column) => toFooterColumn(column, warn))
    .filter((column): column is LayoutConfig['footer']['columns'][number] => column !== undefined)

  const legal = (stored?.footer?.legal ?? [])
    .map((item) => toNavLink(item, warn))
    .filter((link): link is NavLink => link !== undefined)

  const copyright = filled(stored?.footer?.copyright) ? stored.footer.copyright : ''
  if (!filled(stored?.footer?.copyright)) {
    warn('Footer copyright missing; using empty string')
  }

  const sidebarGroups = (stored?.sidebar?.groups ?? [])
    .map((group) => toSidebarGroup(group, warn))
    .filter((group): group is SidebarGroup => group !== undefined)

  const config: LayoutConfig = {
    brand,
    header: { items: headerItems, cta },
    sidebar: { groups: sidebarGroups },
    footer: {
      tagline: filled(stored?.footer?.tagline) ? stored.footer.tagline : undefined,
      columns: footerColumns,
      copyright,
      legal: legal.length > 0 ? legal : undefined,
    },
  }

  return { config, warnings }
}
