import Link from 'next/link'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { LayoutConfig } from '@/lib/nav/types'

import { SidebarLink } from './sidebar-link'

export function PageSidebar({ config }: { config: LayoutConfig }) {
  return (
    <Sidebar variant="inset">
      <SidebarHeader className="px-4 py-3 text-base font-semibold tracking-tight">
        <Link href={config.brand.href}>{config.brand.label}</Link>
      </SidebarHeader>
      <SidebarContent>
        {config.sidebar.groups.map((group, index) => (
          <SidebarGroup key={group.title ?? `group-${index}`}>
            {group.title ? <SidebarGroupLabel>{group.title}</SidebarGroupLabel> : null}
            <SidebarMenu>
              {group.items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarLink item={item} />
                  {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
