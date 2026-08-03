import type { CollectionConfig } from 'payload'

import { authenticated } from '../access'
import { FORM_NAMES, isFormName } from '../lib/forms/definitions'

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
      admin: { description: `One of: ${FORM_NAMES.join(', ')}` },
      validate: (value: unknown) =>
        typeof value === 'string' && isFormName(value)
          ? true
          : `Must be one of: ${FORM_NAMES.join(', ')}`,
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
