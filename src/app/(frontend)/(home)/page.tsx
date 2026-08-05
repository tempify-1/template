import type { Metadata } from 'next'
import React from 'react'

import { Page } from '@/components/ds/section/page'
import { DraftRefresh } from '@/components/ds/shell/draft-refresh'
import { homeSections } from '@/fixtures/pages/home'
import { metadataForPage } from '@/lib/metadata'
import { findPage, sectionsFor } from '@/lib/pages'
import { HOME_SLUG, SITE_NAME } from '@/lib/site'

export async function generateMetadata(): Promise<Metadata> {
  const page = await findPage(HOME_SLUG)
  if (!page) return { title: { absolute: SITE_NAME } }

  return metadataForPage(page)
}

export default async function HomePage() {
  const page = await findPage(HOME_SLUG)
  const sections = page ? await sectionsFor(page) : homeSections

  return (
    <>
      <DraftRefresh />
      <Page sections={sections} />
    </>
  )
}
