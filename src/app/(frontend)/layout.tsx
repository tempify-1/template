import type { Metadata } from 'next'
import React from 'react'

import { ThemeProvider } from '@/components/theme-provider'
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
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
