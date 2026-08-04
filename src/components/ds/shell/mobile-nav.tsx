'use client'

import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import type { HeaderConfig } from '@/lib/nav/types'

import { NavAction } from './nav-action'

export function MobileNav({ header, brandLabel }: { header: HeaderConfig; brandLabel: string }) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
            <MenuIcon className="size-5" aria-hidden />
          </Button>
        }
      />
      <SheetContent side="right" className="w-[18rem]">
        <SheetHeader>
          <SheetTitle>{brandLabel}</SheetTitle>
        </SheetHeader>

        <nav className="flex flex-col gap-1 px-4 pb-6" aria-label="Site">
          {header.items.map((item) => {
            if (item.type === 'menu') {
              return (
                <div key={item.label} className="mt-2 flex flex-col gap-1">
                  <span className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {item.label}
                  </span>
                  {item.items.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="rounded-md px-2 py-2 text-sm hover:bg-accent"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )
            }

            if (item.type === 'action') {
              return (
                <NavAction
                  key={item.label}
                  label={item.label}
                  action={item.action}
                  icon={item.icon}
                  className="justify-start px-2"
                />
              )
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
              >
                {item.label}
              </Link>
            )
          })}

          {header.cta ? (
            <Link
              href={header.cta.href}
              onClick={() => setOpen(false)}
              className={cn(buttonVariants(), 'mt-4')}
            >
              {header.cta.label}
            </Link>
          ) : null}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
