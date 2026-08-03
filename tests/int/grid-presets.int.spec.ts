import { describe, it, expect } from 'vitest'

import { benefitsGrid } from '@/lib/presets/benefits-grid'
import { featureGrid } from '@/lib/presets/feature-grid'
import { presetRegistry } from '@/lib/presets/registry'
import { ICON_NAMES, iconFor } from '@/lib/icons'
import { mapPageResult } from '@/mappers/page'
import type { CardGridBlock } from '@/lib/presets/types'

function cardsOf(section: ReturnType<typeof benefitsGrid>): CardGridBlock['cards'] {
  const grid = section.columns![0]!.blocks!.find((b) => b.blockType === 'cardGrid') as CardGridBlock
  return grid.cards
}

describe('benefitsGrid Preset', () => {
  it('numbers cards in the order given, zero-padded', () => {
    const section = benefitsGrid({
      heading: 'What you get',
      benefits: [{ title: 'One' }, { title: 'Two' }, { title: 'Three' }],
    })

    expect(cardsOf(section).map((c) => c.index)).toEqual(['01', '02', '03'])
  })

  it('carries titles and descriptions onto the cards', () => {
    const section = benefitsGrid({
      heading: 'What you get',
      benefits: [{ title: 'Typed config', description: 'Pages are data' }],
    })

    expect(cardsOf(section)[0]).toMatchObject({
      index: '01',
      title: 'Typed config',
      description: 'Pages are data',
    })
  })

  it('rejects an empty benefit list rather than rendering an empty grid', () => {
    expect(() => benefitsGrid({ heading: 'Nothing', benefits: [] })).toThrow()
  })
})

describe('featureGrid Preset', () => {
  it('keeps the icon as a serializable name, not a component', () => {
    const section = featureGrid({
      heading: 'Features',
      features: [{ icon: 'layers', title: 'Section system' }],
    })

    const card = cardsOf(section)[0]!
    expect(card.icon).toBe('layers')
    expect(typeof card.icon).toBe('string')
    expect(JSON.parse(JSON.stringify(section))).toEqual(section)
  })

  it('rejects an icon name that is not in the registry', () => {
    expect(() =>
      featureGrid({
        heading: 'Features',
        features: [{ icon: 'not-a-real-icon' as never, title: 'Nope' }],
      }),
    ).toThrow()
  })

  it('resolves every registered icon name to a component', () => {
    for (const name of ICON_NAMES) {
      expect(iconFor(name)).toBeDefined()
    }
    expect(iconFor('missing')).toBeUndefined()
    expect(iconFor(undefined)).toBeUndefined()
  })
})

describe('preset registry', () => {
  it('registers all three Presets, which is the ADR-0002 hand-written block budget', () => {
    expect(Object.keys(presetRegistry).sort()).toEqual([
      'benefitsGrid',
      'featureGrid',
      'heroCentered',
    ])
  })
})

describe('mapper dispatches both new blocks', () => {
  it('maps a stored benefitsGrid invocation', () => {
    const { sections, skipped } = mapPageResult({
      sections: [
        {
          blockType: 'benefitsGrid',
          heading: 'Stored benefits',
          benefits: [{ title: 'Stored one' }, { title: 'Stored two' }],
        },
      ],
    } as never)

    expect(skipped).toHaveLength(0)
    expect(cardsOf(sections[0]!).map((c) => c.index)).toEqual(['01', '02'])
  })

  it('maps a stored featureGrid invocation', () => {
    const { sections, skipped } = mapPageResult({
      sections: [
        {
          blockType: 'featureGrid',
          heading: 'Stored features',
          features: [{ icon: 'zap', title: 'Fast' }],
        },
      ],
    } as never)

    expect(skipped).toHaveLength(0)
    expect(cardsOf(sections[0]!)[0]).toMatchObject({ icon: 'zap', title: 'Fast' })
  })

  it('skips a stored featureGrid whose icon is no longer registered', () => {
    const { sections, skipped } = mapPageResult({
      sections: [
        {
          blockType: 'featureGrid',
          heading: 'Stale icon',
          features: [{ icon: 'retired-icon', title: 'Old' }],
        },
      ],
    } as never)

    expect(sections).toHaveLength(0)
    expect(skipped[0]!.blockType).toBe('featureGrid')
  })
})
