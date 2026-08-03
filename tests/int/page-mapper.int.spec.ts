import { getPayload, type Payload } from 'payload'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'

import config from '@/payload.config'
import { mapPage, mapPageResult } from '@/mappers/page'

const SLUG = 'int-mapper-fixture'

let payload: Payload

describe('page mapper', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'pages', where: { slug: { equals: SLUG } } })
  })

  afterAll(async () => {
    await payload.delete({ collection: 'pages', where: { slug: { equals: SLUG } } })
  })

  it('maps a stored Preset invocation to the Section structure the renderer consumes', async () => {
    const created = await payload.create({
      collection: 'pages',
      data: {
        title: 'Mapper fixture',
        slug: SLUG,
        _status: 'published',
        sections: [
          {
            blockType: 'heroCentered',
            heading: 'Stored heading',
            subheading: 'Stored subheading',
            primaryCta: { label: 'Primary', href: '/primary' },
            secondaryCta: { label: 'Secondary', href: '/secondary' },
            trustBadges: [{ text: 'Badge one' }, { text: 'Badge two' }],
          },
        ],
      },
    })

    const sections = mapPage(created)

    expect(sections).toHaveLength(1)
    const [hero] = sections
    expect(hero!.tag).toBe('section')
    expect(hero!.columns).toHaveLength(1)

    const blocks = hero!.columns![0]!.blocks!
    expect(blocks.map((b) => b.blockType)).toEqual([
      'heading',
      'paragraph',
      'buttonRow',
      'badgeRow',
    ])

    const heading = blocks.find((b) => b.blockType === 'heading')!
    expect(heading).toMatchObject({ level: 1, text: 'Stored heading' })

    const buttons = blocks.find((b) => b.blockType === 'buttonRow')!
    expect(buttons).toMatchObject({
      buttons: [
        { label: 'Primary', href: '/primary', variant: 'default' },
        { label: 'Secondary', href: '/secondary', variant: 'outline' },
      ],
    })

    const badges = blocks.find((b) => b.blockType === 'badgeRow')!
    expect(badges).toMatchObject({ badges: ['Badge one', 'Badge two'] })
  })

  it('omits a call to action whose label or href is blank', async () => {
    const page = {
      sections: [
        {
          blockType: 'heroCentered' as const,
          heading: 'Only primary',
          primaryCta: { label: 'Go', href: '/go' },
          secondaryCta: { label: null, href: null },
        },
      ],
    }

    const blocks = mapPage(page)[0]!.columns![0]!.blocks!
    const buttons = blocks.find((b) => b.blockType === 'buttonRow')!

    expect(buttons).toMatchObject({ buttons: [{ label: 'Go', href: '/go' }] })
  })

  it('drops a section whose heading fails the Preset schema, keeping the rest of the page', () => {
    const result = mapPageResult({
      sections: [
        { blockType: 'heroCentered' as const, heading: '', primaryCta: {}, secondaryCta: {} },
        { blockType: 'heroCentered' as const, heading: 'Survivor', primaryCta: {}, secondaryCta: {} },
      ],
    })

    expect(result.sections).toHaveLength(1)
    expect(result.skipped).toHaveLength(1)
    expect(result.skipped[0]!.blockType).toBe('heroCentered')
  })

  it('never throws on malformed stored content, so one bad section cannot 500 the route', () => {
    expect(() =>
      mapPage({
        sections: [{ blockType: 'heroCentered' as const, heading: '', primaryCta: {}, secondaryCta: {} }],
      }),
    ).not.toThrow()
  })

  it('reads the stored page back through the Local API with access enforced', async () => {
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: SLUG } },
      limit: 1,
      overrideAccess: false,
    })

    expect(docs).toHaveLength(1)
    expect(mapPage(docs[0]!)).toHaveLength(1)
  })
})
