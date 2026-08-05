import { cookies } from 'next/headers'
import React, { type ReactNode } from 'react'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

export async function DashboardShell({
  header,
  sidebar,
  children,
}: {
  header: ReactNode
  sidebar: ReactNode
  children: ReactNode
}) {
  const store = await cookies()
  const defaultOpen = store.get('sidebar_state')?.value !== 'false'

  return (
    <TooltipProvider>
      <SidebarProvider
        defaultOpen={defaultOpen}
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        {sidebar}
        <SidebarInset>
          {header}
          <div className="flex flex-1 flex-col">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">{children}</div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
