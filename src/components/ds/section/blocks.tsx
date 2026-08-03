import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { iconFor } from '@/lib/icons'
import { responsiveVars } from '@/lib/presets/types'
import { cn } from '@/lib/utils'
import type {
  BadgeRowBlock,
  ButtonRowBlock,
  CardGridBlock,
  HeadingBlock,
  ParagraphBlock,
} from '@/lib/presets/types'

const HEADING_SIZES: Record<number, string> = {
  1: 'text-xl',
  2: 'text-2xl',
  3: 'text-3xl',
  4: 'text-4xl',
  5: 'text-5xl',
  6: 'text-6xl',
  7: 'text-6xl sm:text-7xl',
  8: 'text-7xl sm:text-8xl',
}

export function Heading({ block }: { block: HeadingBlock }) {
  const Tag = `h${block.level}` as 'h1'

  return (
    <Tag
      className={cn(
        'text-balance font-medium leading-[1.05] tracking-tight text-foreground',
        HEADING_SIZES[block.size ?? block.level + 2] ?? 'text-4xl',
      )}
    >
      {block.text}
    </Tag>
  )
}

export function Paragraph({ block }: { block: ParagraphBlock }) {
  return (
    <p
      className={cn(
        'max-w-prose text-pretty text-muted-foreground',
        block.lead ? 'text-lg sm:text-xl' : 'text-base',
      )}
    >
      {block.text}
    </p>
  )
}

export function ButtonRow({ block }: { block: ButtonRowBlock }) {
  return (
    <div className="ds-row gap-3">
      {block.buttons.map((button) => (
        <a
          key={button.href + button.label}
          href={button.href}
          className={cn(buttonVariants({ variant: button.variant ?? 'default', size: 'lg' }))}
        >
          {button.label}
        </a>
      ))}
    </div>
  )
}

export function CardGrid({ block }: { block: CardGridBlock }) {
  return (
    <ul className="ds-card-grid" style={responsiveVars('cards', block.columns ?? { base: 1, sm: 2, lg: 4 })}>
      {block.cards.map((card, index) => {
        const Icon = iconFor(card.icon)

        return (
          <li
            key={`${card.title}-${index}`}
            className="flex flex-col gap-2 rounded-lg border border-border bg-card p-5 text-left"
          >
            {card.index ? (
              <span className="text-sm font-medium tabular-nums text-muted-foreground">
                {card.index}
              </span>
            ) : null}
            {Icon ? <Icon className="size-5 text-primary" aria-hidden /> : null}
            <h3 className="text-base font-medium text-foreground">{card.title}</h3>
            {card.description ? (
              <p className="text-sm text-pretty text-muted-foreground">{card.description}</p>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
}

export function BadgeRow({ block }: { block: BadgeRowBlock }) {
  return (
    <ul className="ds-row gap-2">
      {block.badges.map((badge) => (
        <li key={badge}>
          <Badge variant="secondary">{badge}</Badge>
        </li>
      ))}
    </ul>
  )
}
