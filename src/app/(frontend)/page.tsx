import { draftMode, headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import React from 'react'

import { Page } from '@/components/ds/section/page'
import { homeSections } from '@/fixtures/pages/home'
import { mapPageResult } from '@/mappers/page'
import type { SectionDefinition } from '@/lib/presets/types'
import config from '@/payload.config'

import '../globals.css'

async function loadHomeSections(): Promise<SectionDefinition[]> {
  const { isEnabled: isDraft } = await draftMode()
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    draft: isDraft,
    user,
    overrideAccess: false,
  })

  const page = docs[0]
  if (!page) return homeSections

  const { sections, skipped } = mapPageResult(page)

  for (const { blockType, reason } of skipped) {
    payload.logger.error(`Dropped "${blockType}" section on page "home": ${reason}`)
  }

  return sections
}

export default async function HomePage() {
  return <Page sections={await loadHomeSections()} />
}
