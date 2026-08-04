import { notFound } from 'next/navigation'
import React from 'react'

import { Page } from '@/components/ds/section/page'
import { decodeSections } from '@/lib/preview-config'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Preview: posted configuration',
  robots: { index: false, follow: false },
}

type Props = { searchParams: Promise<{ c?: string }> }

export default async function ConfigPreviewPage({ searchParams }: Props) {
  const { c } = await searchParams
  if (!c) notFound()

  const sections = decodeSections(c)
  if (!sections) notFound()

  return <Page sections={sections} />
}
