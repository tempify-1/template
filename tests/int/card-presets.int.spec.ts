import { describe, it, expect } from 'vitest'

import { community } from '@/lib/presets/community'
import { ctaBanner } from '@/lib/presets/cta-banner'
import { faqAccordion } from '@/lib/presets/faq-accordion'
import { logoWall } from '@/lib/presets/logo-wall'
import { presetBlocks, presetRegistry } from '@/lib/presets/registry'
import { serviceList } from '@/lib/presets/service-list'
import { mapPageResult } from '@/mappers/page'
import type { Block, SectionDefinition } from '@/lib/presets/types'

function blocksOf(section: SectionDefinition): Block[] {
  return section.columns![0]!.blocks!
}

function blockOf<T extends Block['blockType']>(section: SectionDefinition, type: T) {
  return blocksOf(section).find((b) => b.blockType === type) as Extract<Block, { blockType: T }>
}

describe('logoWall', () => {
  it('renders logos as a row and emits the heading as a real heading element', () => {
    const withHeading = logoWall({ heading: 'Trusted by', logos: [{ name: 'Acme' }, { name: 'Globex' }] })

    expect(blockOf(withHeading, 'logoRow').logos.map((l) => l.name)).toEqual(['Acme', 'Globex'])
    expect(blockOf(withHeading, 'heading')).toMatchObject({ level: 2, text: 'Trusted by' })
    expect(blockOf(withHeading, 'paragraph')).toBeUndefined()

    const without = logoWall({ logos: [{ name: 'Acme' }] })
    expect(blocksOf(without)).toHaveLength(1)
  })

  it('refuses an empty logo list', () => {
    expect(() => logoWall({ logos: [] })).toThrow()
  })
})

describe('serviceList', () => {
  it('carries an optional badge per service', () => {
    const section = serviceList({
      heading: 'Services',
      services: [
        { title: 'Review', description: 'A read', badge: 'Pro' },
        { title: 'Support' },
      ],
    })

    const items = blockOf(section, 'itemList').items
    expect(items[0]).toMatchObject({ title: 'Review', badge: 'Pro' })
    expect(items[1]!.badge).toBeUndefined()
  })
})

describe('ctaBanner and community', () => {
  it('omits a call to action left incomplete', () => {
    const section = ctaBanner({
      heading: 'Ready?',
      primaryCta: { label: 'Go', href: '/go' },
    })

    expect(blockOf(section, 'buttonRow').buttons).toHaveLength(1)
  })

  it('renders no button row at all when the community call to action is absent', () => {
    const section = community({ heading: 'Join us', body: 'Come along' })

    expect(blockOf(section, 'buttonRow')).toBeUndefined()
  })
})

describe('faqAccordion', () => {
  it('maps question and answer pairs onto accordion items in order', () => {
    const section = faqAccordion({
      heading: 'Questions',
      questions: [
        { question: 'First?', answer: 'Yes' },
        { question: 'Second?', answer: 'Also yes' },
      ],
    })

    expect(blockOf(section, 'accordion').items).toEqual([
      { question: 'First?', answer: 'Yes' },
      { question: 'Second?', answer: 'Also yes' },
    ])
  })

  it('requires an answer for every question', () => {
    expect(() =>
      faqAccordion({ heading: 'Q', questions: [{ question: 'Why?', answer: '' }] }),
    ).toThrow()
  })
})

describe('the generator covers every Preset without a hand-written block', () => {
  it('produces one Payload block per registered Preset', () => {
    const blocks = presetBlocks()

    expect(blocks).toHaveLength(Object.keys(presetRegistry).length)
    expect(blocks.map((b) => b.slug)).toEqual(
      expect.arrayContaining([
        'logoWall',
        'serviceList',
        'ctaBanner',
        'community',
        'faqAccordion',
      ]),
    )
  })

  it('gives every generated block at least one field and non-empty labels', () => {
    for (const block of presetBlocks()) {
      expect(block.fields.length, block.slug).toBeGreaterThan(0)
      expect(block.labels?.singular, block.slug).toBeTruthy()
      expect(block.labels?.plural, block.slug).toBeTruthy()
    }
  })
})

describe('mapper dispatches all five new blocks', () => {
  it('maps each stored invocation without skipping', () => {
    const { sections, skipped } = mapPageResult({
      sections: [
        { blockType: 'logoWall', logos: [{ name: 'Acme' }] },
        { blockType: 'serviceList', heading: 'S', services: [{ title: 'One', badge: 'Pro' }] },
        { blockType: 'ctaBanner', heading: 'C', primaryCta: { label: 'Go', href: '/go' } },
        { blockType: 'community', heading: 'J', cta: { label: null, href: null } },
        { blockType: 'faqAccordion', heading: 'F', questions: [{ question: 'Q?', answer: 'A' }] },
      ],
    } as never)

    expect(skipped).toHaveLength(0)
    expect(sections).toHaveLength(5)
  })

  it('skips only the malformed section, keeping the rest of the page', () => {
    const { sections, skipped } = mapPageResult({
      sections: [
        { blockType: 'logoWall', logos: [] },
        { blockType: 'community', heading: 'Still here' },
      ],
    } as never)

    expect(sections).toHaveLength(1)
    expect(skipped[0]!.blockType).toBe('logoWall')
  })
})
