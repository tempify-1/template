import type { GlobalConfig } from 'payload'
import { z } from 'zod'

import { authenticated } from '@/access'
import { siteShellTag } from '@/lib/cache-tags'
import { ICON_NAMES } from '@/lib/icons'
import { NAV_ACTIONS, type ActionName } from '@/lib/nav/actions'
import { fieldsFromSchema } from '@/lib/presets/payload-fields'

const actionNames = [...NAV_ACTIONS] as [ActionName, ...ActionName[]]

const linkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  description: z.string().optional(),
  icon: z.enum(ICON_NAMES).optional(),
  external: z.boolean().optional(),
})

const headerItemSchema = z.object({
  kind: z.enum(['link', 'menu', 'action']),
  label: z.string().min(1),
  href: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.enum(ICON_NAMES).optional(),
  external: z.boolean().optional(),
  items: z.array(linkSchema).optional(),
  action: z.enum(actionNames).optional(),
  actionIcon: z.enum(ICON_NAMES).optional(),
})

const ctaSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  external: z.boolean().optional(),
})

const footerColumnSchema = z.object({
  title: z.string().min(1),
  items: z.array(linkSchema).min(1),
})

const navigationSchema = z.object({
  brand: z.object({
    label: z.string().min(1),
    href: z.string().min(1),
  }),
  header: z.object({
    items: z.array(headerItemSchema).min(1),
    cta: ctaSchema.optional(),
  }),
  footer: z.object({
    tagline: z.string().optional(),
    columns: z.array(footerColumnSchema).min(1),
    copyright: z.string().min(1),
    legal: z.array(linkSchema).optional(),
  }),
})

export type StoredNavigation = z.infer<typeof navigationSchema>

async function revalidateNavigation(): Promise<void> {
  try {
    const { revalidateTag } = await import('next/cache')
    revalidateTag(siteShellTag(), { expire: 0 })
  } catch {}
}

export const Navigation: GlobalConfig = {
  slug: 'navigation',
  label: 'Navigation',
  access: {
    read: () => true,
    update: authenticated,
  },
  fields: fieldsFromSchema(navigationSchema),
  hooks: {
    afterChange: [
      async ({ doc, context }) => {
        if (context?.disableRevalidate) return doc
        await revalidateNavigation()
        return doc
      },
    ],
  },
}
