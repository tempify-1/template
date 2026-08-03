import { z } from 'zod'

import type { SectionDefinition } from './types'

export const SECTION_THEMES = ['muted', 'accent', 'brand'] as const

export type SectionTheme = (typeof SECTION_THEMES)[number]

export const themeArgs = {
  theme: z
    .enum(SECTION_THEMES)
    .optional()
    .meta({
      payload: {
        label: 'Theme',
        description: 'Recolours this Section and everything in it. Leave empty for the page Theme.',
      },
    }),
}

export function isSectionTheme(value: unknown): value is SectionTheme {
  return typeof value === 'string' && SECTION_THEMES.includes(value as SectionTheme)
}

export function themed(theme: SectionTheme, section: SectionDefinition): SectionDefinition {
  return { ...section, theme }
}
