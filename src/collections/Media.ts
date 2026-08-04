import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    create: authenticated,
    read: () => true,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: true,
}
