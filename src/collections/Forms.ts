import type { CollectionConfig } from 'payload'

import { authenticated, authenticatedOrPublished } from '../access'
import { cmsFieldSchema } from '../lib/forms/cms-form-schema'
import { fieldsFromSchema } from '../lib/presets/payload-fields'

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export const Forms: CollectionConfig = {
  slug: 'forms',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug', '_status', 'updatedAt'],
  },
  access: {
    create: authenticated,
    read: authenticatedOrPublished,
    update: authenticated,
    delete: authenticated,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: { description: 'Lower-case words separated by hyphens, e.g. event-signup.' },
      validate: (value: unknown) =>
        typeof value === 'string' && SLUG_PATTERN.test(value)
          ? true
          : 'Use lower-case letters, numbers and hyphens only, with no leading or trailing hyphen.',
    },
    {
      name: 'submitLabel',
      type: 'text',
      required: true,
      defaultValue: 'Submit',
    },
    {
      name: 'successMessage',
      type: 'text',
      required: true,
    },
    {
      name: 'summaryField',
      type: 'text',
      required: true,
      admin: { description: 'The field whose value is shown in the submissions list.' },
    },
    {
      name: 'fields',
      type: 'array',
      required: true,
      labels: { singular: 'Field', plural: 'Fields' },
      fields: fieldsFromSchema(cmsFieldSchema),
    },
  ],
}
