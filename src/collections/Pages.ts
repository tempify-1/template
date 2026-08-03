import type { CollectionConfig } from 'payload'

import { authenticated, authenticatedOrPublished } from '../access'
import { BenefitsGridBlock } from './blocks/benefits-grid'
import { FeatureGridBlock } from './blocks/feature-grid'
import { HeroCenteredBlock } from './blocks/hero-centered'

function pathForSlug(slug: unknown): string | null {
  if (typeof slug !== 'string' || slug.length === 0) return null
  return slug === 'home' ? '/' : `/${slug}`
}

async function revalidate(paths: (string | null)[]): Promise<void> {
  const unique = [...new Set(paths.filter((path): path is string => path !== null))]
  if (unique.length === 0) return

  try {
    const { revalidatePath } = await import('next/cache')
    for (const path of unique) revalidatePath(path)
  } catch {
    return
  }
}

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
      blocks: [HeroCenteredBlock, BenefitsGridBlock, FeatureGridBlock],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, context }) => {
        if (context?.disableRevalidate) return doc
        if (doc._status !== 'published' && previousDoc?._status !== 'published') return doc

        await revalidate([pathForSlug(doc.slug), pathForSlug(previousDoc?.slug)])
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, context }) => {
        if (context?.disableRevalidate) return doc

        await revalidate([pathForSlug(doc.slug)])
        return doc
      },
    ],
  },
}
