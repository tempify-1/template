import { headers as getHeaders } from 'next/headers'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import React from 'react'

import { Page } from '@/components/ds/section/page'
import { decodeSections } from '@/lib/preview-config'
import config from '@/payload.config'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Preview: posted configuration',
  robots: { index: false, follow: false },
}

type Props = { searchParams: Promise<{ c?: string }> }

export default async function ConfigPreviewPage({ searchParams }: Props) {
  const payload = await getPayload({ config: await config })
  const { user } = await payload.auth({ headers: await getHeaders() })
  if (!user) notFound()

  const { c } = await searchParams
  if (!c) notFound()

  const sections = decodeSections(c)
  if (!sections) notFound()

  return <Page sections={sections} />
}
