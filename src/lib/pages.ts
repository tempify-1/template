import { unstable_cache } from 'next/cache'
import { draftMode, headers as getHeaders } from 'next/headers'
import { cache } from 'react'
import { getPayload } from 'payload'

import { mapPageResult } from '@/mappers/page'
import type { SectionDefinition } from '@/lib/presets/types'
import type { Page } from '@/payload-types'
import config from '@/payload.config'

export const PAGES_TAG = 'pages'

export function pageTag(slug: string): string {
  return `page:${slug}`
}

async function findPublished(slug: string): Promise<Page | null> {
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    draft: false,
    overrideAccess: false,
  })

  return docs[0] ?? null
}

function cachedPublished(slug: string): Promise<Page | null> {
  return unstable_cache(() => findPublished(slug), ['page', slug], {
    tags: [PAGES_TAG, pageTag(slug)],
  })()
}

async function findDraft(slug: string): Promise<Page | null> {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })

  if (!user) return findPublished(slug)

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    draft: true,
    user,
    overrideAccess: false,
  })

  return docs[0] ?? null
}

export async function findPage(slug: string): Promise<Page | null> {
  const { isEnabled: isDraft } = await draftMode()

  return isDraft ? findDraft(slug) : cachedPublished(slug)
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

async function findPublishedPages(): Promise<Pick<Page, 'slug' | 'updatedAt'>[]> {
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
    pagination: false,
    depth: 0,
    select: { slug: true, updatedAt: true },
    overrideAccess: false,
  })

  return docs.map((doc) => ({ slug: doc.slug, updatedAt: doc.updatedAt }))
}

export function publishedPages(): Promise<Pick<Page, 'slug' | 'updatedAt'>[]> {
  return unstable_cache(findPublishedPages, ['published-pages'], { tags: [PAGES_TAG] })()
}
