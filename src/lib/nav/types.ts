import type { IconName } from '@/lib/icons'

import type { ActionName } from './actions'

export interface NavLink {
  label: string
  href: string
  description?: string
  icon?: IconName
  external?: boolean
}

export type NavItem =
  | ({ type: 'link' } & NavLink)
  | { type: 'menu'; label: string; items: NavLink[] }
  | { type: 'action'; label: string; action: ActionName; icon?: IconName }

export interface HeaderConfig {
  items: NavItem[]
  cta?: NavLink
}

export interface FooterColumn {
  title: string
  items: NavLink[]
}

export interface FooterConfig {
  tagline?: string
  columns: FooterColumn[]
  copyright: string
  legal?: NavLink[]
}

export interface LayoutConfig {
  brand: { label: string; href: string }
  header: HeaderConfig
  footer: FooterConfig
}

export function navLinksOf(item: NavItem): NavLink[] {
  return item.type === 'menu' ? item.items : item.type === 'link' ? [item] : []
}
