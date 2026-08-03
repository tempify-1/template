import { heroCentered, heroCenteredArgs } from './hero-centered'

export const presetRegistry = {
  heroCentered: { schema: heroCenteredArgs, factory: heroCentered },
} as const

export type PresetName = keyof typeof presetRegistry
