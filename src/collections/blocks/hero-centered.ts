import type { Block } from 'payload'

const callToAction = (name: string, label: string) =>
  ({
    name,
    type: 'group' as const,
    label,
    admin: { description: 'Leave both fields empty to omit this call to action.' },
    fields: [
      { name: 'label', type: 'text' as const },
      { name: 'href', type: 'text' as const },
    ],
  })

export const HeroCenteredBlock: Block = {
  slug: 'heroCentered',
  interfaceName: 'HeroCenteredBlock',
  labels: {
    singular: 'Hero (centered)',
    plural: 'Heroes (centered)',
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
    callToAction('primaryCta', 'Primary call to action'),
    callToAction('secondaryCta', 'Secondary call to action'),
    {
      name: 'trustBadges',
      type: 'array',
      labels: { singular: 'Badge', plural: 'Badges' },
      fields: [{ name: 'text', type: 'text', required: true }],
    },
  ],
}
