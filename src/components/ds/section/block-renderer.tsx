import type { ReactNode } from 'react'

import type { Block, BlockType } from '@/lib/presets/types'

import { BadgeRow, ButtonRow, Heading, Paragraph } from './blocks'

type BlockRenderers = {
  [K in BlockType]: (props: { block: Extract<Block, { blockType: K }> }) => ReactNode
}

export const blockRegistry: BlockRenderers = {
  heading: Heading,
  paragraph: Paragraph,
  buttonRow: ButtonRow,
  badgeRow: BadgeRow,
}

export function BlockRenderer({ block }: { block: Block }) {
  const Component = blockRegistry[block.blockType] as (props: { block: Block }) => ReactNode
  return <Component block={block} />
}
