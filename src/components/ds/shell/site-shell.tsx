import Link from 'next/link'
import type { ReactNode } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { externalProps } from '@/lib/nav/link'
import type { LayoutConfig } from '@/lib/nav/types'

import { FooterLink } from './footer-link'
import { HeaderNav } from './header-nav'
import { MobileNav } from './mobile-nav'

function SiteHeader({ config }: { config: LayoutConfig }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-4 px-4">
        <Link href={config.brand.href} className="text-base font-semibold tracking-tight">
          {config.brand.label}
        </Link>

        <div className="flex-1">
          <HeaderNav items={config.header.items} />
        </div>

        {config.header.cta ? (
          <Link
            href={config.header.cta.href}
            className={cn(buttonVariants({ size: 'sm' }), 'hidden md:inline-flex')}
            {...externalProps(config.header.cta)}
          >
            {config.header.cta.label}
          </Link>
        ) : null}

        <MobileNav header={config.header} brandLabel={config.brand.label} />
      </div>
    </header>
  )
}

function SiteFooter({ config }: { config: LayoutConfig }) {
  const { footer } = config

  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto w-full max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-[1.5fr_repeat(3,1fr)]">
          <div className="flex flex-col gap-2">
            <span className="text-base font-semibold tracking-tight">{config.brand.label}</span>
            {footer.tagline ? (
              <p className="max-w-xs text-sm text-muted-foreground">{footer.tagline}</p>
            ) : null}
          </div>

          {footer.columns.map((column) => (
            <nav key={column.title} aria-label={column.title} className="flex flex-col gap-3">
              <span className="text-sm font-medium">{column.title}</span>
              {column.items.map((link, linkIndex) => (
                <FooterLink
                  key={`${link.href}-${linkIndex}`}
                  link={link}
                  className="text-sm text-muted-foreground hover:text-foreground aria-[current=page]:text-foreground data-active:text-foreground"
                />
              ))}
            </nav>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <span>{footer.copyright}</span>
          {footer.legal?.length ? (
            <nav aria-label="Legal" className="flex gap-4">
              {footer.legal.map((link, linkIndex) => (
                <FooterLink
                  key={`${link.href}-${linkIndex}`}
                  link={link}
                  className="hover:text-foreground aria-[current=page]:text-foreground data-active:text-foreground"
                />
              ))}
            </nav>
          ) : null}
        </div>
      </div>
    </footer>
  )
}

export function SiteShell({ config, children }: { config: LayoutConfig; children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader config={config} />
      <div className="flex-1">{children}</div>
      <SiteFooter config={config} />
    </div>
  )
}
