import { describe, it, expect } from 'vitest'

import { presetBlocks } from '@/lib/presets/registry'
import { teamGrid } from '@/lib/presets/team-grid'
import { testimonialCarousel } from '@/lib/presets/testimonial-carousel'
import { mapPageResult } from '@/mappers/page'
import type {
  Block,
  PersonGridBlock,
  SectionDefinition,
  TestimonialCarouselBlock,
} from '@/lib/presets/types'
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

describe('testimonialCarousel', () => {
  it('keeps quote, name and optional title in the order given', () => {
    const section = testimonialCarousel({
      heading: 'Loved by teams',
      testimonials: [
        { quote: 'First quote', name: 'Priya', title: 'Engineering' },
        { quote: 'Second quote', name: 'Tom' },
      ],
    })

    const block = blockOf(section, 'testimonialCarousel') as TestimonialCarouselBlock
    expect(block.testimonials).toEqual([
      { quote: 'First quote', name: 'Priya', title: 'Engineering', image: undefined },
      { quote: 'Second quote', name: 'Tom', title: undefined, image: undefined },
    ])
  })

  it('refuses a testimonial with no quote', () => {
    expect(() =>
      testimonialCarousel({ heading: 'H', testimonials: [{ quote: '', name: 'Priya' }] }),
    ).toThrow()
  })

  it('renders the Section header without a carousel when no testimonial survives', () => {
    const section = testimonialCarousel({ heading: 'Still here', testimonials: [] })

    expect(blockOf(section, 'heading')).toMatchObject({ text: 'Still here' })
    expect(blockOf(section, 'testimonialCarousel')).toBeUndefined()
  })
})

describe('teamGrid', () => {
  it('carries name, role and links onto each person', () => {
    const section = teamGrid({
      heading: 'The team',
      members: [
        { name: 'Priya', role: 'Engineering', links: [{ label: 'Profile', href: '/priya' }] },
        { name: 'Tom', role: 'Design' },
      ],
    })

    const block = blockOf(section, 'personGrid') as PersonGridBlock
    expect(block.people[0]).toMatchObject({
      name: 'Priya',
      role: 'Engineering',
      links: [{ label: 'Profile', href: '/priya' }],
    })
    expect(block.people[1]).toMatchObject({ name: 'Tom', role: 'Design', links: [] })
  })

  it('requires a role, since a name alone is not a team entry', () => {
    expect(() => teamGrid({ heading: 'T', members: [{ name: 'Priya', role: '' }] })).toThrow()
  })

  it('keeps the Section header when every member row is incomplete', () => {
    const section = teamGrid({ heading: 'The people behind it', members: [] })

    expect(blockOf(section, 'heading')).toMatchObject({ text: 'The people behind it' })
    expect(blockOf(section, 'personGrid')).toBeUndefined()
  })
})

describe('generated blocks for both Presets', () => {
  it('generates an upload field for the testimonial portrait and the member photo', () => {
    const blocks = presetBlocks()

    const testimonials = byName(
      blocks.find((b) => b.slug === 'testimonialCarousel')!.fields,
      'testimonials',
    )
    expect(byName(testimonials.fields as Field[], 'image')).toMatchObject({
      type: 'upload',
      relationTo: 'media',
      label: 'Portrait',
    })

    const members = byName(blocks.find((b) => b.slug === 'teamGrid')!.fields, 'members')
    expect(byName(members.fields as Field[], 'image')).toMatchObject({
      type: 'upload',
      relationTo: 'media',
      label: 'Photo',
    })
  })

  it('nests the member links array inside the member rows', () => {
    const members = byName(presetBlocks().find((b) => b.slug === 'teamGrid')!.fields, 'members')
    const links = byName(members.fields as Field[], 'links')

    expect(links).toMatchObject({ type: 'array' })
    expect(byName(links.fields as Field[], 'href')).toMatchObject({ type: 'text', required: true })
  })
})

describe('mapper dispatch for both Presets', () => {
  it('maps stored testimonials and members without skipping', () => {
    const { sections, skipped } = mapPageResult({
      sections: [
        {
          blockType: 'testimonialCarousel',
          heading: 'Quotes',
          testimonials: [{ quote: 'Great', name: 'Priya', title: 'Eng' }],
        },
        {
          blockType: 'teamGrid',
          heading: 'Team',
          members: [{ name: 'Tom', role: 'Design', links: [{ label: 'Profile', href: '/tom' }] }],
        },
      ],
    } as never)

    expect(skipped).toHaveLength(0)
    expect(sections).toHaveLength(2)
  })

  it('drops an incomplete row rather than the whole Section', () => {
    const { sections, skipped } = mapPageResult({
      sections: [
        {
          blockType: 'teamGrid',
          heading: 'Team',
          members: [
            { name: 'Half', role: '' },
            { name: 'Tom', role: 'Design' },
          ],
        },
      ],
    } as never)

    expect(skipped).toHaveLength(0)
    const block = blockOf(sections[0]!, 'personGrid') as PersonGridBlock
    expect(block.people.map((p) => p.name)).toEqual(['Tom'])
  })

  it('keeps the Section when every row is incomplete, and says why', () => {
    const { sections, skipped, warnings } = mapPageResult({
      sections: [
        {
          blockType: 'teamGrid',
          heading: 'The people behind it',
          members: [{ name: 'Ade' }, { name: 'Tom' }],
        },
      ],
    } as never)

    expect(skipped).toHaveLength(0)
    expect(sections).toHaveLength(1)
    expect(blockOf(sections[0]!, 'personGrid')).toBeUndefined()
    expect(warnings[0]!.reason).toContain('2 member row(s) dropped')
  })

  it('reports dropped rows rather than losing them silently', () => {
    const { warnings } = mapPageResult({
      sections: [
        {
          blockType: 'teamGrid',
          heading: 'Team',
          members: [
            { name: 'Half', role: '' },
            { name: 'Tom', role: 'Design' },
          ],
        },
      ],
    } as never)

    expect(warnings[0]!.reason).toContain('1 member row(s) dropped')
  })

  it('treats a whitespace-only required field as missing', () => {
    const { sections, warnings } = mapPageResult({
      sections: [
        {
          blockType: 'testimonialCarousel',
          heading: 'Quotes',
          testimonials: [
            { quote: '   ', name: 'A' },
            { quote: 'Real', name: 'B' },
          ],
        },
      ],
    } as never)

    const block = blockOf(sections[0]!, 'testimonialCarousel') as TestimonialCarouselBlock
    expect(block.testimonials.map((t) => t.name)).toEqual(['B'])
    expect(warnings[0]!.reason).toContain('1 testimonial row(s) dropped')
  })

  it('still asks Payload for at least one row despite the renderer tolerating zero', () => {
    const members = byName(presetBlocks().find((b) => b.slug === 'teamGrid')!.fields, 'members')

    expect(members).toMatchObject({ minRows: 1, required: true })
  })

  it('drops a link missing its href rather than rendering a dead anchor', () => {
    const { sections } = mapPageResult({
      sections: [
        {
          blockType: 'teamGrid',
          heading: 'Team',
          members: [{ name: 'Tom', role: 'Design', links: [{ label: 'Profile', href: '' }] }],
        },
      ],
    } as never)

    const block = blockOf(sections[0]!, 'personGrid') as PersonGridBlock
    expect(block.people[0]!.links).toEqual([])
  })
})
