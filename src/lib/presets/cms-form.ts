import { z } from 'zod'

import { formSection } from './form-section'
import { sectionHeaderArgs } from './section-header'
import type { SectionDefinition } from './types'

export const cmsFormArgs = z.object({
  ...sectionHeaderArgs,
  form: z
    .string()
    .min(1)
    .meta({
      payload: { type: 'relationship', relationTo: 'forms' },
    }),
})

export type CmsFormArgs = z.input<typeof cmsFormArgs>

export function cmsForm({ heading, subheading, form }: CmsFormArgs): SectionDefinition {
  return formSection(form)({ heading, subheading })
}
