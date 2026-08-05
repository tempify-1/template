import type { NavLink } from './types'

export interface ExternalProps {
  target?: '_blank'
  rel?: string
}

export function externalProps(link: Pick<NavLink, 'external'>): ExternalProps {
  return link.external ? { target: '_blank', rel: 'noreferrer noopener' } : {}
}

function addressable(href: string): boolean {
  return !href.startsWith('http') && !href.startsWith('#')
}

export function isCurrent(href: string, pathname: string): boolean {
  return addressable(href) && pathname === href
}

export function isAncestor(href: string, pathname: string): boolean {
  if (!addressable(href) || href === '/') return false
  return pathname.startsWith(`${href}/`)
}

export function currentProps(
  href: string,
  pathname: string,
): { 'aria-current'?: 'page'; 'data-active'?: true } {
  if (isCurrent(href, pathname)) return { 'aria-current': 'page', 'data-active': true }
  if (isAncestor(href, pathname)) return { 'data-active': true }
  return {}
}
