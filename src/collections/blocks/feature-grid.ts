import type { Block } from 'payload'

import { ICON_NAMES } from '../../lib/icons'

export const FeatureGridBlock: Block = {
  slug: 'featureGrid',
  interfaceName: 'FeatureGridBlock',
  labels: {
    singular: 'Feature grid',
    plural: 'Feature grids',
  },
  fields: [
    {
      name: 'heading',
      type: 'text',
      required: true,
    },
    {
      name: 'subheading',
      type: 'textarea',
    },
    {
      name: 'features',
      type: 'array',
      minRows: 1,
      labels: { singular: 'Feature', plural: 'Features' },
      fields: [
        {
          name: 'icon',
          type: 'select',
          required: true,
          options: [...ICON_NAMES].map((name) => ({ label: name, value: name })),
        },
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
      ],
    },
  ],
}
