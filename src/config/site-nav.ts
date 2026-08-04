import type { LayoutConfig } from '@/lib/nav/types'

export const siteNav: LayoutConfig = {
  brand: { label: 'Tempify', href: '/' },
  header: {
    items: [
      {
        type: 'menu',
        label: 'Product',
        items: [
          {
            label: 'Landing page',
            href: '/',
            description: 'Sections composed from typed Presets, rendered on the server.',
            icon: 'layers',
          },
          {
            label: 'Dashboard',
            href: '/dashboard',
            description: 'Sidebar, cards and a data table assembled from shadcn blocks.',
            icon: 'gauge',
          },
          {
            label: 'Charts',
            href: '/dashboard/charts',
            description: 'Recharts wrappers reading the same semantic tokens as everything else.',
            icon: 'chart',
          },
        ],
      },
      { type: 'link', label: 'Admin', href: '/admin' },
      { type: 'action', label: 'Toggle theme', action: 'toggleTheme', icon: 'sparkles' },
    ],
    cta: { label: 'Start free trial', href: '/signup' },
  },
  footer: {
    tagline: 'A Payload and Next.js template where pages are typed configuration, not markup.',
    columns: [
      {
        title: 'Product',
        items: [
          { label: 'Overview', href: '/' },
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Charts', href: '/dashboard/charts' },
        ],
      },
      {
        title: 'Resources',
        items: [
          { label: 'Documentation', href: '/docs' },
          { label: 'Admin panel', href: '/admin' },
        ],
      },
      {
        title: 'Company',
        items: [
          { label: 'Contact', href: '/contact' },
          { label: 'Community', href: 'https://discord.gg', external: true },
        ],
      },
    ],
    copyright: '© 2026 Tempify. All rights reserved.',
    legal: [
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
}
