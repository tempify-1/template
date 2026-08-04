import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { Page } from '@/components/ds/section/page'
import { DraftRefresh } from '@/components/ds/shell/draft-refresh'
import { metadataForPage } from '@/lib/metadata'
import { findPage, sectionsFor } from '@/lib/pages'

type Params = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const page = slug === 'home' ? null : await findPage(slug)
  if (!page) return {}

  return metadataForPage(page)
}

export default async function SlugPage({ params }: Params) {
  const { slug } = await params
  if (slug === 'home') notFound()

  const page = await findPage(slug)
  if (!page) notFound()

  return (
    <>
      <DraftRefresh />
      <Page sections={await sectionsFor(page)} />
    </>
  )
}
