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

  it('defaults to monthly billing in US dollars, so a minimal config renders', () => {
    const block = blockOf(pricing({ heading: 'P', tiers: [tier] }), 'pricingTable')

    expect(block.defaultPeriod).toBe('monthly')
    expect(block.currency).toBe('USD')
    expect(block.locale).toBe('en-US')
  })

  it('keeps the Section header when no tier survives, rather than losing the Section', () => {
    const section = pricing({ heading: 'Still here', tiers: [] })

    expect(blockOf(section, 'heading')).toMatchObject({ text: 'Still here' })
    expect(blockOf(section, 'pricingTable')).toBeUndefined()
  })

  it('highlights only the first tier that asks to be highlighted', () => {
    const block = blockOf(
      pricing({
        heading: 'P',
        tiers: [
          { ...tier, name: 'A', featured: true },
          { ...tier, name: 'B', featured: true },
          { ...tier, name: 'C', featured: true },
        ],
      }),
      'pricingTable',
    )

    expect(block.tiers.map((t) => t.featured)).toEqual([true, false, false])
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

describe('content an editor can save never deletes the Section', () => {
  const base = {
    blockType: 'pricing',
    heading: 'Pricing',
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

  function sectionsFrom(overrides: Record<string, unknown>) {
    return mapPageResult({ sections: [{ ...base, ...overrides }] } as never)
  }

  it('keeps the Section when the currency was cleared', () => {
    const { sections, skipped } = sectionsFrom({ currency: '' })

    expect(skipped).toHaveLength(0)
    expect(blockOf(sections[0]!, 'pricingTable').currency).toBe('USD')
  })

  it('keeps the Section when the locale was cleared', () => {
    const { sections, skipped } = sectionsFrom({ locale: '' })

    expect(skipped).toHaveLength(0)
    expect(blockOf(sections[0]!, 'pricingTable').locale).toBe('en-US')
  })

  it('keeps the Section when a tier has only whitespace features', () => {
    const { sections, skipped, warnings } = sectionsFrom({
      tiers: [{ ...base.tiers[0]!, features: [{ text: '   ' }] }],
    })

    expect(skipped).toHaveLength(0)
    expect(blockOf(sections[0]!, 'pricingTable')).toBeUndefined()
    expect(warnings[0]!.reason).toContain('tier row(s) dropped')
  })

  it('keeps the Section when every tier is half-filled, as during a live edit', () => {
    const { sections, skipped } = sectionsFrom({
      tiers: [
        {
          name: 'Draft tier',
          monthlyPrice: 0,
          annualPrice: 0,
          features: [],
          ctaLabel: '',
          ctaHref: '',
        },
      ],
    })

    expect(skipped).toHaveLength(0)
    expect(blockOf(sections[0]!, 'heading')).toMatchObject({ text: 'Pricing' })
  })

  it('drops a tier with a negative price rather than losing the Section', () => {
    const { sections, skipped } = sectionsFrom({
      tiers: [{ ...base.tiers[0]!, name: 'Bad', monthlyPrice: -10 }, base.tiers[0]!],
    })

    expect(skipped).toHaveLength(0)
    expect(blockOf(sections[0]!, 'pricingTable').tiers.map((t) => t.name)).toEqual(['Starter'])
  })

  it('never lets a stored pricing block be skipped, whatever the row content', () => {
    const nasty = [
      { currency: '  ' },
      { locale: 'not-a-locale' },
      { defaultPeriod: null },
      { tiers: [] },
      { tiers: [{ ...base.tiers[0]!, ctaHref: '   ' }] },
      { tiers: [{ ...base.tiers[0]!, monthlyPrice: -1, annualPrice: -1 }] },
    ]

    for (const overrides of nasty) {
      const { skipped } = sectionsFrom(overrides)
      expect(skipped, JSON.stringify(overrides)).toHaveLength(0)
    }
  })
})

describe('the generated block matches what the Preset accepts', () => {
  it('stops an editor entering a negative price in the admin', () => {
    const tiers = byName(presetBlocks().find((b) => b.slug === 'pricing')!.fields, 'tiers')

    expect(byName(tiers.fields as Field[], 'monthlyPrice')).toMatchObject({ min: 0 })
    expect(byName(tiers.fields as Field[], 'annualPrice')).toMatchObject({ min: 0 })
  })

  it('asks for at least one tier and at least one feature', () => {
    const tiers = byName(presetBlocks().find((b) => b.slug === 'pricing')!.fields, 'tiers')

    expect(tiers).toMatchObject({ minRows: 1, required: true })
    expect(byName(tiers.fields as Field[], 'features')).toMatchObject({ minRows: 1 })
  })
})
