import { draftMode, headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'

import { mapPageResult } from '@/mappers/page'
import type { SectionDefinition } from '@/lib/presets/types'
import type { Page } from '@/payload-types'
import config from '@/payload.config'

export async function findPage(slug: string): Promise<Page | null> {
  const { isEnabled: isDraft } = await draftMode()
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    draft: isDraft,
    user,
    overrideAccess: false,
  })

  return docs[0] ?? null
}

export async function sectionsFor(page: Page): Promise<SectionDefinition[]> {
  const payload = await getPayload({ config: await config })
  const { sections, skipped, warnings } = mapPageResult(page)

  for (const { blockType, reason } of skipped) {
    payload.logger.error(`Dropped "${blockType}" section on page "${page.slug}": ${reason}`)
  }

  for (const { blockType, reason } of warnings) {
    payload.logger.warn(`Rendered "${blockType}" section on page "${page.slug}": ${reason}`)
  }

  return sections
}

export async function publishedPages(): Promise<Pick<Page, 'slug' | 'updatedAt'>[]> {
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
    limit: 1000,
    depth: 0,
    select: { slug: true, updatedAt: true },
    overrideAccess: false,
  })

  return docs.map((doc) => ({ slug: doc.slug, updatedAt: doc.updatedAt }))
}
