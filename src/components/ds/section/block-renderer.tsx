import type { ReactNode } from 'react'

import { resolveForm } from '@/lib/forms/resolve-form'
import type { Block, BlockType, FormBlock as FormBlockSpec } from '@/lib/presets/types'

import { AccordionList } from './accordion-block'
import { FormBlock } from './form-block'
import { ImageMedia } from './image-block'
import { PricingTable } from './pricing-block'
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
  [K in BlockType]: (props: {
    block: Extract<Block, { blockType: K }>
  }) => ReactNode | Promise<ReactNode>
}

async function ResolvedFormBlock({ block }: { block: FormBlockSpec }) {
  const definition = await resolveForm(block.formName)
  return <FormBlock block={block} definition={definition} />
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
  form: ResolvedFormBlock,
  pricingTable: PricingTable,
}

export function BlockRenderer({ block }: { block: Block }) {
  const Component = blockRegistry[block.blockType] as (props: {
    block: Block
  }) => ReactNode | Promise<ReactNode>
  return <Component block={block} />
}
