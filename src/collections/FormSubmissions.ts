import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'

export const FormSubmissions: CollectionConfig = {
  slug: 'form-submissions',
  admin: {
    useAsTitle: 'form',
    defaultColumns: ['form', 'summary', 'createdAt'],
  },
  access: {
    create: () => false,
    read: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'form',
      type: 'text',
      required: true,
      index: true,
      admin: { description: 'The form reference this submission answered.' },
    },
    {
      name: 'summary',
      type: 'text',
    },
    {
      name: 'data',
      type: 'json',
      required: true,
    },
  ],
}
