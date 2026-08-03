import { z } from 'zod'

import { sectionHeaderArgs, sectionHeaderBlocks } from './section-header'
import type { Block, SectionDefinition } from './types'

const callToAction = z
  .object({
    label: z.string().min(1),
    href: z.string().min(1),
  })
  .optional()

export const ctaBannerArgs = z.object({
  ...sectionHeaderArgs,
  primaryCta: callToAction.meta({
    payload: {
      label: 'Primary call to action',
      description: 'Leave both fields empty to omit this call to action.',
    },
  }),
  secondaryCta: callToAction.meta({
    payload: {
      label: 'Secondary call to action',
      description: 'Leave both fields empty to omit this call to action.',
    },
  }),
})

export type CtaBannerArgs = z.input<typeof ctaBannerArgs>

export function ctaBanner(input: CtaBannerArgs): SectionDefinition {
  const args = ctaBannerArgs.parse(input)

  const blocks: Block[] = sectionHeaderBlocks(args, 6)

  const buttons = [
    args.primaryCta && { ...args.primaryCta, variant: 'default' as const },
    args.secondaryCta && { ...args.secondaryCta, variant: 'outline' as const },
  ].filter((button) => button !== undefined)

  if (buttons.length > 0) {
    blocks.push({ blockType: 'buttonRow', buttons })
  }

  return {
    tag: 'section',
    gutter: 'lg',
    columnLayout: 1,
    columns: [{ justify: 'center', blocks }],
  }
}
