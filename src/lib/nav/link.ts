import type { NavLink } from './types'

export interface ExternalProps {
  target?: '_blank'
  rel?: string
}

export function externalProps(link: Pick<NavLink, 'external'>): ExternalProps {
  return link.external ? { target: '_blank', rel: 'noreferrer noopener' } : {}
}

export function isCurrent(href: string, pathname: string): boolean {
  if (href.startsWith('http') || href.startsWith('#')) return false
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function currentProps(
  href: string,
  pathname: string,
): { 'aria-current'?: 'page'; 'data-active'?: true } {
  return isCurrent(href, pathname) ? { 'aria-current': 'page', 'data-active': true } : {}
}
