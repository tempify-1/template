import type { CollectionConfig } from 'payload'

import { authenticated, authenticatedOrPublished } from '../access'
import { PAGES_TAG, pageTag } from '../lib/pages'
import { presetBlocks } from '../lib/presets/registry'
import { previewPath } from '../lib/preview'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

async function revalidate(slugs: unknown[]): Promise<void> {
  const unique = [
    ...new Set(slugs.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)),
  ]
  if (unique.length === 0) return

  try {
    const { revalidatePath, revalidateTag } = await import('next/cache')
    for (const slug of unique) revalidateTag(pageTag(slug), 'max')
    revalidateTag(PAGES_TAG, 'max')
    revalidatePath('/sitemap.xml')
  } catch {
    return
  }
}

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    livePreview: {
      url: ({ data }) => previewPath(data?.slug),
    },
    preview: (data) => previewPath(data?.slug),
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
      admin: { description: 'Lower-case words separated by hyphens, e.g. about-us.' },
      validate: (value: unknown) =>
        typeof value === 'string' && SLUG_PATTERN.test(value)
          ? true
          : 'Use lower-case letters, numbers and hyphens only, with no leading or trailing hyphen.',
    },
    {
      name: 'sections',
      type: 'blocks',
      blocks: presetBlocks(),
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, context }) => {
        if (context?.disableRevalidate) return doc
        if (doc._status !== 'published' && previousDoc?._status !== 'published') return doc

        await revalidate([doc.slug, previousDoc?.slug])
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, context }) => {
        if (context?.disableRevalidate) return doc

        await revalidate([doc.slug])
        return doc
      },
    ],
  },
}
