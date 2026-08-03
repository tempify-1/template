import { z } from 'zod'

import type { Block, SectionDefinition } from './types'

export const logoWallArgs = z.object({
  heading: z.string().optional(),
  logos: z
    .array(z.string().min(1))
    .min(1)
    .meta({ payload: { singular: 'Logo', plural: 'Logos', itemField: 'name' } }),
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
