import type { ZodType } from 'zod'

import { heroCentered, heroCenteredArgs } from './hero-centered'
import type { SectionDefinition } from './types'

export interface PresetEntry<TInput = never> {
  schema: ZodType<unknown, TInput>
  factory: (input: TInput) => SectionDefinition
}

export const presetRegistry = {
  heroCentered: { schema: heroCenteredArgs, factory: heroCentered },
} as const

export type PresetName = keyof typeof presetRegistry

export function isPresetName(value: string): value is PresetName {
  return value in presetRegistry
}
