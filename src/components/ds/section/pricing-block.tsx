import { CheckIcon } from 'lucide-react'
import Link from 'next/link'

import { buttonVariants } from '@/components/ui/button'
import type { PricingTableBlock, PricingTierSpec } from '@/lib/presets/types'
import { cn } from '@/lib/utils'

import { PricingPeriodScope } from './pricing-period'

function formatPrice(amount: number, currency: string): string {
  return `${currency}${amount.toLocaleString('en-US')}`
}

function Price({ tier, currency }: { tier: PricingTierSpec; currency: string }) {
  return (
    <p className="flex items-baseline gap-1">
      <span className="text-4xl font-semibold tracking-tight tabular-nums">
        <span className="group-data-[period=annual]/pricing:hidden">
          {formatPrice(tier.monthlyPrice, currency)}
        </span>
        <span className="group-data-[period=monthly]/pricing:hidden">
          {formatPrice(tier.annualPrice, currency)}
        </span>
      </span>
      <span className="text-sm text-muted-foreground">
        <span className="group-data-[period=annual]/pricing:hidden">per month</span>
        <span className="group-data-[period=monthly]/pricing:hidden">per year</span>
      </span>
    </p>
  )
}

function Tier({ tier, currency }: { tier: PricingTierSpec; currency: string }) {
  return (
    <li
      data-tier={tier.name}
      data-featured={tier.featured || undefined}
      className={cn(
        'flex flex-col gap-6 rounded-xl border border-border bg-card p-6 text-left',
        tier.featured && 'border-primary ring-1 ring-primary',
      )}
    >
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-medium">{tier.name}</h3>
        {tier.description ? (
          <p className="text-sm text-muted-foreground">{tier.description}</p>
        ) : null}
      </div>

      <Price tier={tier} currency={currency} />

      <ul className="flex flex-col gap-3">
        {tier.features.map((feature) => (
          <li key={feature} className="flex gap-2 text-sm">
            <CheckIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Link
        href={tier.cta.href}
        className={cn(
          buttonVariants({ variant: tier.featured ? 'default' : 'outline' }),
          'mt-auto w-full',
        )}
      >
        {tier.cta.label}
      </Link>
    </li>
  )
}

export function PricingTable({ block }: { block: PricingTableBlock }) {
  return (
    <PricingPeriodScope defaultPeriod={block.defaultPeriod} annualNote={block.annualNote}>
      <ul className="grid w-full gap-6 md:grid-cols-3">
        {block.tiers.map((tier) => (
          <Tier key={tier.name} tier={tier} currency={block.currency} />
        ))}
      </ul>
    </PricingPeriodScope>
  )
}
