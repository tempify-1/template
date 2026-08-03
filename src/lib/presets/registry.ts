import type { Block } from 'payload'

import { benefitsGrid, benefitsGridArgs } from './benefits-grid'
import { featureGrid, featureGridArgs } from './feature-grid'
import { heroCentered, heroCenteredArgs } from './hero-centered'
import { blockFromSchema } from './payload-fields'

export const presetRegistry = {
  heroCentered: {
    schema: heroCenteredArgs,
    factory: heroCentered,
    singular: 'Hero (centered)',
    plural: 'Heroes (centered)',
  },
  benefitsGrid: {
    schema: benefitsGridArgs,
    factory: benefitsGrid,
    singular: 'Benefits grid',
    plural: 'Benefits grids',
  },
  featureGrid: {
    schema: featureGridArgs,
    factory: featureGrid,
    singular: 'Feature grid',
    plural: 'Feature grids',
  },
} as const

export type PresetName = keyof typeof presetRegistry

export function presetBlocks(): Block[] {
  return Object.entries(presetRegistry).map(([slug, entry]) =>
    blockFromSchema({
      slug,
      schema: entry.schema,
      singular: entry.singular,
      plural: entry.plural,
    }),
  )
}
