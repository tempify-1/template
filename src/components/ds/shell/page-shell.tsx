import type { ReactNode } from 'react'

import { siteNav } from '@/config/site-nav'
import { shellFor } from '@/lib/shells'

import { BlankShell } from './blank-shell'
import { DashboardShell } from './dashboard-shell'
import { PageHeader } from './page-header'
import { PageSidebar } from './page-sidebar'
import { SiteShell } from './site-shell'

export function PageShell({
  shell,
  title,
  children,
}: {
  shell: unknown
  title: string
  children: ReactNode
}) {
  const resolved = shellFor(shell)

  if (resolved === 'dashboard') {
    return (
      <DashboardShell
        header={<PageHeader title={title} />}
        sidebar={<PageSidebar config={siteNav} />}
      >
        {children}
      </DashboardShell>
    )
  }

  if (resolved === 'blank') return <BlankShell>{children}</BlankShell>

  return <SiteShell config={siteNav}>{children}</SiteShell>
}
