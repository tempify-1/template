import { getPayload } from 'payload'
import React from 'react'

import { Page } from '@/components/ds/section/page'
import { homeSections } from '@/fixtures/pages/home'
import { mapPage } from '@/mappers/page'
import config from '@/payload.config'

import '../globals.css'

async function loadHomeSections() {
  const payload = await getPayload({ config: await config })

  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
    overrideAccess: false,
  })

  const page = docs[0]
  if (!page) return homeSections

  const sections = mapPage(page)
  return sections.length > 0 ? sections : homeSections
}

export default async function HomePage() {
  return <Page sections={await loadHomeSections()} />
}
