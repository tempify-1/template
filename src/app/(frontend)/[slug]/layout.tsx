import type { ReactNode } from 'react'

import { PageShell } from '@/components/ds/shell/page-shell'
import { findPage } from '@/lib/pages'
import { SITE_NAME, isHomeSlug } from '@/lib/site'

export default async function SlugLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const page = isHomeSlug(slug) ? null : await findPage(slug)

  return (
    <PageShell shell={page?.shell} title={page?.title ?? SITE_NAME}>
      {children}
    </PageShell>
  )
}
