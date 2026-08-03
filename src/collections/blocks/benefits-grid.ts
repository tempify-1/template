import type { Block } from 'payload'

export const BenefitsGridBlock: Block = {
  slug: 'benefitsGrid',
  interfaceName: 'BenefitsGridBlock',
  labels: {
    singular: 'Benefits grid',
    plural: 'Benefits grids',
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
      name: 'benefits',
      type: 'array',
      minRows: 1,
      admin: { description: 'Numbered automatically in the order listed here.' },
      labels: { singular: 'Benefit', plural: 'Benefits' },
      fields: [
        { name: 'title', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
      ],
    },
  ],
}
