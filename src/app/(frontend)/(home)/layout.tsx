import type { ReactNode } from 'react'

import { PageShell } from '@/components/ds/shell/page-shell'
import { findPage } from '@/lib/pages'
import { HOME_SLUG, SITE_NAME } from '@/lib/site'

export default async function HomeLayout({ children }: { children: ReactNode }) {
  const page = await findPage(HOME_SLUG)

  return (
    <PageShell shell={page?.shell} title={page?.title ?? SITE_NAME}>
      {children}
    </PageShell>
  )
}
