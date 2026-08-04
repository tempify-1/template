import { notFound } from 'next/navigation'
import React from 'react'

import { Page } from '@/components/ds/section/page'
import { isFixtureName, presetFixtures } from '@/fixtures/presets'

export const dynamic = 'force-dynamic'

type Params = { params: Promise<{ preset: string }> }

export async function generateMetadata({ params }: Params) {
  const { preset } = await params

  return { title: `Preview: ${preset}`, robots: { index: false, follow: false } }
}

export default async function PresetPreviewPage({ params }: Params) {
  const { preset } = await params
  if (!isFixtureName(preset)) notFound()

  return <Page sections={[presetFixtures[preset]]} />
}
