import type { CollectionConfig } from 'payload'

import { authenticated, authenticatedOrPublished } from '../access'
import { HeroCenteredBlock } from './blocks/hero-centered'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  access: {
    create: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    drafts: {
      autosave: { interval: 2000 },
    },
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'sections',
      type: 'blocks',
      blocks: [HeroCenteredBlock],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, context }) => {
        if (context?.disableRevalidate) return doc

        const path = doc.slug === 'home' ? '/' : `/${doc.slug}`
        try {
          const { revalidatePath } = await import('next/cache')
          revalidatePath(path)
        } catch {
          return doc
        }
        return doc
      },
    ],
  },
}
