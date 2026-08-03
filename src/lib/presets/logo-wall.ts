import { z } from 'zod'

import { imageArgs } from './media'
import type { Block, SectionDefinition } from './types'

export const logoWallArgs = z.object({
  heading: z.string().optional(),
  logos: z
    .array(
      z.object({
        name: z.string().min(1),
        image: imageArgs.optional(),
      }),
    )
    .min(1)
    .meta({ payload: { singular: 'Logo', plural: 'Logos' } }),
})

export type LogoWallArgs = z.input<typeof logoWallArgs>

export function logoWall(input: LogoWallArgs): SectionDefinition {
  const args = logoWallArgs.parse(input)

  const blocks: Block[] = []
  if (args.heading) {
    blocks.push({ blockType: 'heading', level: 2, text: args.heading, size: 3 })
  }
  blocks.push({ blockType: 'logoRow', logos: args.logos })

  return {
    tag: 'section',
    gutter: 'sm',
    columnLayout: 1,
    columns: [{ justify: 'center', blocks }],
  }
}
