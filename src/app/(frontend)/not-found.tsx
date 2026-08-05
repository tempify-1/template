import Link from 'next/link'

import { SiteShell } from '@/components/ds/shell/site-shell'
import { loadNavigation } from '@/lib/navigation'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Page not found',
}

export default async function NotFound() {
  return (
    <SiteShell config={await loadNavigation()}>
      <main className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-32 text-center">
        <p className="text-sm font-medium text-muted-foreground">404</p>
        <h1 className="text-4xl font-semibold tracking-tight">This page does not exist</h1>
        <p className="text-muted-foreground">
          The link may be out of date, or the page may not have been built yet.
        </p>
        <Link href="/" className={cn(buttonVariants())}>
          Back to the home page
        </Link>
      </main>
    </SiteShell>
  )
}
