import type { Block, BlockType } from '@/lib/presets/types'

import { BadgeRow, ButtonRow, Heading, Paragraph } from './blocks'

type BlockComponent = (props: { block: never }) => React.ReactNode

export const blockRegistry = {
  heading: Heading,
  paragraph: Paragraph,
  buttonRow: ButtonRow,
  badgeRow: BadgeRow,
} as unknown as Record<BlockType, BlockComponent>

export function BlockRenderer({ block }: { block: Block }) {
  const Component = blockRegistry[block.blockType]
  if (!Component) return null
  return <Component block={block as never} />
}
