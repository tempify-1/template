import Link from 'next/link'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import type { LayoutConfig, NavItem } from '@/lib/nav/types'
import { navLinksOf } from '@/lib/nav/types'

function groupsFrom(items: NavItem[]) {
  return items
    .map((item) => ({
      title: item.type === 'menu' ? item.label : undefined,
      links: navLinksOf(item),
    }))
    .filter((group) => group.links.length > 0)
}

export function PageSidebar({ config }: { config: LayoutConfig }) {
  return (
    <Sidebar variant="inset">
      <SidebarHeader className="px-4 py-3 text-base font-semibold tracking-tight">
        <Link href={config.brand.href}>{config.brand.label}</Link>
      </SidebarHeader>
      <SidebarContent>
        {groupsFrom(config.header.items).map((group, index) => (
          <SidebarGroup key={group.title ?? index}>
            {group.title ? <SidebarGroupLabel>{group.title}</SidebarGroupLabel> : null}
            <SidebarMenu>
              {group.links.map((link) => (
                <SidebarMenuItem key={link.href}>
                  <SidebarMenuButton render={<Link href={link.href}>{link.label}</Link>} />
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
