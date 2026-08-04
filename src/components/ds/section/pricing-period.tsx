'use client'

import { useState, type ReactNode } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { BillingPeriod } from '@/lib/presets/pricing'

export function PricingPeriodScope({
  defaultPeriod,
  annualNote,
  children,
}: {
  defaultPeriod: BillingPeriod
  annualNote?: string
  children: ReactNode
}) {
  const [period, setPeriod] = useState<BillingPeriod>(defaultPeriod)

  return (
    <div className="group/pricing flex w-full flex-col items-center gap-8" data-period={period}>
      <div data-billing-toggle className="flex flex-col items-center gap-2">
        <ToggleGroup
          multiple={false}
          value={[period]}
          onValueChange={(value) => setPeriod((value[0] as BillingPeriod) ?? period)}
          variant="outline"
          aria-label="Billing period"
        >
          <ToggleGroupItem value="monthly">Monthly</ToggleGroupItem>
          <ToggleGroupItem value="annual">Annual</ToggleGroupItem>
        </ToggleGroup>
        {annualNote ? (
          <p className="text-sm text-muted-foreground group-data-[period=monthly]/pricing:invisible">
            {annualNote}
          </p>
        ) : null}
      </div>

      <p aria-live="polite" className="sr-only">
        {period === 'annual' ? 'Showing annual pricing' : 'Showing monthly pricing'}
      </p>

      {children}
    </div>
  )
}
