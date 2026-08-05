import React from 'react'

import { AppSidebar } from '@/components/app-sidebar'
import { DashboardShell } from '@/components/ds/shell/dashboard-shell'
import { SiteHeader } from '@/components/site-header'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'

import '../globals.css'

export const metadata = {
  title: 'Dashboard',
  description: 'Dashboard shell composed from shadcn blocks.',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <DashboardShell header={<SiteHeader />} sidebar={<AppSidebar variant="inset" />}>
            {children}
          </DashboardShell>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
