import { getPayload } from 'payload'

import { siteNav } from '@/config/site-nav'
import type { StoredNavigation } from '@/globals/Navigation'
import { mapNavigation } from '@/mappers/navigation'
import type { LayoutConfig } from '@/lib/nav/types'
import config from '@/payload.config'

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

    return navConfig
  } catch (error) {
    console.error('Failed to load navigation, falling back to fixture:', error)
    return siteNav
  }
}
