import type { CSSProperties } from 'react'

export const BREAKPOINTS = ['sm', 'md', 'lg', 'xl', '2xl'] as const
export type Breakpoint = (typeof BREAKPOINTS)[number]

export type Responsive<T> = T | ({ base?: T } & Partial<Record<Breakpoint, T>>)

export type GutterSize = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'

export interface HeadingBlock {
  blockType: 'heading'
  level: 1 | 2 | 3 | 4 | 5 | 6
  text: string
  size?: number
}

export interface ParagraphBlock {
  blockType: 'paragraph'
  text: string
  lead?: boolean
}

export interface ButtonSpec {
  label: string
  href: string
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
}

export interface ButtonRowBlock {
  blockType: 'buttonRow'
  buttons: ButtonSpec[]
}

export interface BadgeRowBlock {
  blockType: 'badgeRow'
  badges: string[]
}

export interface CardSpec {
  title: string
  description?: string
  icon?: string
  index?: string
}

export interface CardGridBlock {
  blockType: 'cardGrid'
  columns?: Responsive<number>
  cards: CardSpec[]
}

export interface LogoRowBlock {
  blockType: 'logoRow'
  logos: string[]
}

export interface ListItemSpec {
  title: string
  description?: string
  badge?: string
}

export interface ItemListBlock {
  blockType: 'itemList'
  items: ListItemSpec[]
}

export interface AccordionItemSpec {
  question: string
  answer: string
}

export interface AccordionBlock {
  blockType: 'accordion'
  items: AccordionItemSpec[]
}

export type Block =
  | HeadingBlock
  | ParagraphBlock
  | ButtonRowBlock
  | BadgeRowBlock
  | CardGridBlock
  | LogoRowBlock
  | ItemListBlock
  | AccordionBlock

export type BlockType = Block['blockType']

export interface ColumnDefinition {
  colSpan?: Responsive<number>
  justify?: 'left' | 'center' | 'right'
  verticalAlignment?: 'top' | 'middle' | 'bottom'
  blocks?: Block[]
}

export interface SectionDefinition {
  tag?: 'header' | 'section' | 'footer'
  gutter?: GutterSize
  columnLayout?: Responsive<number>
  columns?: ColumnDefinition[]
  minHeight?: string
}

export function responsiveVars(name: string, value?: Responsive<number>): CSSProperties {
  if (value === undefined) return {}
  if (typeof value === 'number') return { [`--${name}`]: String(value) } as CSSProperties

  const vars: Record<string, string> = {}
  if (value.base !== undefined) vars[`--${name}`] = String(value.base)
  for (const breakpoint of BREAKPOINTS) {
    const at = value[breakpoint]
    if (at !== undefined) vars[`--${name}-${breakpoint}`] = String(at)
  }
  return vars as CSSProperties
}
