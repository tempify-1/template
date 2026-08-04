import React from 'react'

import { SiteShell } from '@/components/ds/shell/site-shell'
import { ThemeProvider } from '@/components/theme-provider'
import { siteNav } from '@/config/site-nav'

import '../globals.css'

export const metadata = {
  description: 'A blank template using Payload in a Next.js app.',
  title: 'Payload Blank Template',
}

export default async function RootLayout(props: { children: React.ReactNode }) {
  const { children } = props

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <SiteShell config={siteNav}>{children}</SiteShell>
        </ThemeProvider>
      </body>
    </html>
  )
}
