import React from 'react'

import { Page } from '@/components/ds/section/page'
import { homeSections } from '@/fixtures/pages/home'

import '../globals.css'

export default function HomePage() {
  return <Page sections={homeSections} />
}
