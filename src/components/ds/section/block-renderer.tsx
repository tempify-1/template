import type { ReactNode } from 'react'

import type { Block, BlockType } from '@/lib/presets/types'

import { AccordionList } from './accordion-block'
import { FormBlock } from './form-block'
import { ImageMedia } from './image-block'
import { TestimonialCarousel } from './testimonial-carousel-block'
import {
  BadgeRow,
  ButtonRow,
  CardGrid,
  Heading,
  ItemList,
  LogoRow,
  Paragraph,
  PersonGrid,
} from './blocks'

type BlockRenderers = {
  [K in BlockType]: (props: { block: Extract<Block, { blockType: K }> }) => ReactNode
}

export const blockRegistry: BlockRenderers = {
  heading: Heading,
  paragraph: Paragraph,
  buttonRow: ButtonRow,
  badgeRow: BadgeRow,
  cardGrid: CardGrid,
  logoRow: LogoRow,
  itemList: ItemList,
  accordion: AccordionList,
  image: ImageMedia,
  testimonialCarousel: TestimonialCarousel,
  personGrid: PersonGrid,
  form: FormBlock,
}

export function BlockRenderer({ block }: { block: Block }) {
  const Component = blockRegistry[block.blockType] as (props: { block: Block }) => ReactNode
  return <Component block={block} />
}
