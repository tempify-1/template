import type { ReactNode } from 'react'

import { PageShell } from '@/components/ds/shell/page-shell'
import { findPage } from '@/lib/pages'
import { HOME_SLUG } from '@/lib/site'

export default async function HomeLayout({ children }: { children: ReactNode }) {
  const page = await findPage(HOME_SLUG)

  return <PageShell shell={page?.shell}>{children}</PageShell>
}
