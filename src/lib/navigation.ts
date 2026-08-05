import { getPayload } from 'payload'

import { siteNav } from '@/config/site-nav'
import type { StoredNavigation } from '@/globals/Navigation'
import { mapNavigation } from '@/mappers/navigation'
import type { LayoutConfig } from '@/lib/nav/types'
import config from '@/payload.config'

export function isUsableNavigation(navConfig: LayoutConfig): boolean {
  return (
    navConfig.header.items.length > 0 &&
    navConfig.footer.columns.length > 0 &&
    navConfig.sidebar.groups.length > 0
  )
}

export async function loadNavigation(): Promise<LayoutConfig> {
  try {
    const payload = await getPayload({ config: await config })
    const doc = await payload.findGlobal({
      slug: 'navigation',
      overrideAccess: false,
    })

    if (!doc || !('id' in doc) || !doc.id) return siteNav

    const stored = doc as StoredNavigation
    const { config: navConfig, warnings } = mapNavigation(stored)

    for (const warning of warnings) {
      payload.logger.warn(`Navigation: ${warning}`)
    }

    if (!isUsableNavigation(navConfig)) {
      payload.logger.error(
        'Navigation: every stored header item was dropped, falling back to the code fixture rather than rendering a site with no navigation',
      )
      return siteNav
    }

    return navConfig
  } catch (error) {
    console.error('Failed to load navigation, falling back to fixture:', error)
    return siteNav
  }
}
