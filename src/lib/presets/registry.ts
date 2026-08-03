import { benefitsGrid, benefitsGridArgs } from './benefits-grid'
import { featureGrid, featureGridArgs } from './feature-grid'
import { heroCentered, heroCenteredArgs } from './hero-centered'

export const presetRegistry = {
  heroCentered: { schema: heroCenteredArgs, factory: heroCentered },
  benefitsGrid: { schema: benefitsGridArgs, factory: benefitsGrid },
  featureGrid: { schema: featureGridArgs, factory: featureGrid },
} as const

export type PresetName = keyof typeof presetRegistry
