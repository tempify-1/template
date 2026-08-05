import React from 'react'

import { loadNavigation } from '@/lib/navigation'

import { DashboardShell } from '@/components/ds/shell/dashboard-shell'
import { PageHeader } from '@/components/ds/shell/page-header'
import { PageSidebar } from '@/components/ds/shell/page-sidebar'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

import '../globals.css'

export const metadata = {
  title: 'Dashboard',
  description: 'Dashboard shell composed from shadcn blocks.',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <DashboardShell
            header={<PageHeader title="Dashboard" />}
            sidebar={<PageSidebar config={await loadNavigation()} />}
          >
            {children}
          </DashboardShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
