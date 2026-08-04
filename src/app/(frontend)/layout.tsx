import type { Metadata } from 'next'
import React from 'react'

import { SiteShell } from '@/components/ds/shell/site-shell'
import { ThemeProvider } from '@/components/theme-provider'
import { siteNav } from '@/config/site-nav'
import { SITE_NAME, siteUrl } from '@/lib/site'

import '../globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  description: 'A Payload and Next.js template where pages are typed configuration, not markup.',
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
