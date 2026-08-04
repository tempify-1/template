import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, it, expect } from 'vitest'

import { pricing } from '@/lib/presets/pricing'
import { presetBlocks } from '@/lib/presets/registry'
import { mapPageResult } from '@/mappers/page'
import type { Block, PricingTableBlock, SectionDefinition } from '@/lib/presets/types'
import type { Field } from 'payload'

function blockOf<T extends Block['blockType']>(section: SectionDefinition, type: T) {
  return section.columns![0]!.blocks!.find((b) => b.blockType === type) as Extract<
    Block,
    { blockType: T }
  >
}

function byName(fields: Field[], name: string) {
  return fields.find((f) => 'name' in f && f.name === name) as never as Record<string, unknown>
}

const tier = {
  name: 'Starter',
  monthlyPrice: 29,
  annualPrice: 290,
  features: ['One site'],
  ctaLabel: 'Start',
  ctaHref: '/signup',
}

describe('the pricing Preset', () => {
  it('carries both figures for every tier, so the toggle swaps data already present', () => {
    const section = pricing({
      heading: 'Pricing',
      tiers: [tier, { ...tier, name: 'Team', monthlyPrice: 89, annualPrice: 890 }],
    })

    const block = blockOf(section, 'pricingTable') as PricingTableBlock
    expect(block.tiers.map((t) => [t.monthlyPrice, t.annualPrice])).toEqual([
      [29, 290],
      [89, 890],
    ])
  })

  it('folds the flat call to action fields into one link', () => {
    const block = blockOf(pricing({ heading: 'P', tiers: [tier] }), 'pricingTable')

    expect(block.tiers[0]!.cta).toEqual({ label: 'Start', href: '/signup' })
  })

  it('defaults to monthly billing in the dollar, so a minimal config renders', () => {
    const block = blockOf(pricing({ heading: 'P', tiers: [tier] }), 'pricingTable')

    expect(block.defaultPeriod).toBe('monthly')
    expect(block.currency).toBe('$')
  })

  it('refuses a tier with no features, since an empty card sells nothing', () => {
    expect(() => pricing({ heading: 'P', tiers: [{ ...tier, features: [] }] })).toThrow()
  })

  it('refuses a negative price rather than rendering one', () => {
    expect(() => pricing({ heading: 'P', tiers: [{ ...tier, monthlyPrice: -1 }] })).toThrow()
  })

  it('refuses a Section with no tiers at all', () => {
    expect(() => pricing({ heading: 'P', tiers: [] })).toThrow()
  })

  it('marks a tier unfeatured unless it says otherwise', () => {
    const block = blockOf(
      pricing({ heading: 'P', tiers: [tier, { ...tier, name: 'Team', featured: true }] }),
      'pricingTable',
    )

    expect(block.tiers.map((t) => t.featured)).toEqual([false, true])
  })
})

describe('the generated pricing block', () => {
  it('gives an editor a repeatable tier with both figures', () => {
    const fields = presetBlocks().find((b) => b.slug === 'pricing')!.fields
    const tiers = byName(fields, 'tiers')

    expect(tiers).toMatchObject({ type: 'array', minRows: 1, required: true })
    for (const name of ['name', 'monthlyPrice', 'annualPrice', 'ctaLabel', 'ctaHref']) {
      expect(byName(tiers.fields as Field[], name), name).toBeDefined()
    }
  })

  it('offers the billing period as a choice rather than free text', () => {
    const fields = presetBlocks().find((b) => b.slug === 'pricing')!.fields
    const period = byName(fields, 'defaultPeriod') as { type: string; options: { value: string }[] }

    expect(period.type).toBe('select')
    expect(period.options.map((o) => o.value)).toEqual(['monthly', 'annual'])
  })
})

describe('mapping a stored pricing block', () => {
  const stored = {
    blockType: 'pricing',
    heading: 'Pricing',
    currency: '£',
    defaultPeriod: 'annual',
    tiers: [
      {
        name: 'Starter',
        monthlyPrice: 29,
        annualPrice: 290,
        features: [{ text: 'One site' }],
        ctaLabel: 'Start',
        ctaHref: '/signup',
      },
    ],
  }

  it('renders what the editor stored, including the currency and period', () => {
    const { sections, skipped } = mapPageResult({ sections: [stored] } as never)

    expect(skipped).toHaveLength(0)
    const block = blockOf(sections[0]!, 'pricingTable') as PricingTableBlock
    expect(block).toMatchObject({ currency: '£', defaultPeriod: 'annual' })
    expect(block.tiers[0]!.features).toEqual(['One site'])
  })

  it('drops a tier missing its call to action rather than rendering a dead button', () => {
    const { sections, warnings } = mapPageResult({
      sections: [
        {
          ...stored,
          tiers: [{ ...stored.tiers[0]!, name: 'Broken', ctaHref: '' }, stored.tiers[0]!],
        },
      ],
    } as never)

    const block = blockOf(sections[0]!, 'pricingTable') as PricingTableBlock
    expect(block.tiers.map((t) => t.name)).toEqual(['Starter'])
    expect(warnings[0]!.reason).toContain('1 tier row(s) dropped')
  })

  it('drops a blank feature row rather than rendering an empty bullet', () => {
    const { sections } = mapPageResult({
      sections: [
        {
          ...stored,
          tiers: [{ ...stored.tiers[0]!, features: [{ text: '  ' }, { text: 'Real' }] }],
        },
      ],
    } as never)

    const block = blockOf(sections[0]!, 'pricingTable') as PricingTableBlock
    expect(block.tiers[0]!.features).toEqual(['Real'])
  })
})

describe('the client boundary', () => {
  const read = (file: string) =>
    readFileSync(join(process.cwd(), 'src/components/ds/section', file), 'utf8')

  it('keeps the toggle as the only client component in the Section', () => {
    expect(read('pricing-period.tsx').startsWith("'use client'")).toBe(true)
    expect(read('pricing-block.tsx')).not.toContain("'use client'")
  })

  it('leaves the tier cards free of state, so they stay server-rendered', () => {
    const source = read('pricing-block.tsx')

    for (const hook of ['useState', 'useEffect', 'useReducer', 'onClick']) {
      expect(source, hook).not.toContain(hook)
    }
  })
})
