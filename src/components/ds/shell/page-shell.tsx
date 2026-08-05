import type { ReactNode } from 'react'

import { siteNav } from '@/config/site-nav'
import { DEFAULT_SHELL, isShellName, type ShellName } from '@/lib/shells'

import { BlankShell } from './blank-shell'
import { DashboardShell } from './dashboard-shell'
import { SiteShell } from './site-shell'

function shellFor(shell: unknown): ShellName {
  return isShellName(shell) ? shell : DEFAULT_SHELL
}

export function PageShell({ shell, children }: { shell: unknown; children: ReactNode }) {
  const resolved = shellFor(shell)

  if (resolved === 'dashboard') return <DashboardShell>{children}</DashboardShell>
  if (resolved === 'blank') return <BlankShell>{children}</BlankShell>

  return <SiteShell config={siteNav}>{children}</SiteShell>
}
