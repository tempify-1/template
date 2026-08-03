import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { describe, it, beforeAll, afterAll, expect } from 'vitest'
import { z } from 'zod'
import type { Field } from 'payload'

import config from '@/payload.config'
import { fieldsFromSchema } from '@/lib/presets/payload-fields'
import { imageArgs, toImage } from '@/lib/presets/media'
import { presetBlocks } from '@/lib/presets/registry'
import { mapPageResult } from '@/mappers/page'
import type { LogoRowBlock } from '@/lib/presets/types'

const SLUG = 'int-media-round-trip'

let payload: Payload
let mediaId: number

function byName(fields: Field[], name: string) {
  return fields.find((f) => 'name' in f && f.name === name) as never as Record<string, unknown>
}

describe('the generator maps a media reference to an upload field', () => {
  it('emits an upload field pointing at the media collection', () => {
    const fields = fieldsFromSchema(z.object({ picture: imageArgs }))

    expect(byName(fields, 'picture')).toMatchObject({
      type: 'upload',
      relationTo: 'media',
      required: true,
    })
  })

  it('respects optionality like every other generated field', () => {
    const fields = fieldsFromSchema(z.object({ picture: imageArgs.optional() }))

    expect(byName(fields, 'picture')).toMatchObject({ type: 'upload', required: false })
  })

  it('does not walk the media object shape into a group', () => {
    const fields = fieldsFromSchema(z.object({ picture: imageArgs }))

    expect(byName(fields, 'picture').fields).toBeUndefined()
  })

  it('generates the logo wall image field without a hand-written block', () => {
    const logoWallBlock = presetBlocks().find((b) => b.slug === 'logoWall')!
    const logos = byName(logoWallBlock.fields, 'logos')
    const rowFields = logos.fields as Field[]

    expect(byName(rowFields, 'image')).toMatchObject({ type: 'upload', relationTo: 'media' })
    expect(byName(rowFields, 'name')).toMatchObject({ type: 'text', required: true })
  })
})

describe('toImage', () => {
  it('unwraps a populated media document into the flat shape the design system uses', () => {
    expect(toImage({ url: '/media/a.png', alt: 'A logo', width: 120, height: 40 })).toEqual({
      src: '/media/a.png',
      alt: 'A logo',
      width: 120,
      height: 40,
    })
  })

  it('returns undefined rather than throwing for an unpopulated relationship', () => {
    expect(toImage(7)).toBeUndefined()
    expect(toImage(null)).toBeUndefined()
    expect(toImage(undefined)).toBeUndefined()
  })

  it('returns undefined when the document is missing dimensions or alt', () => {
    expect(toImage({ url: '/media/a.png', alt: 'A', width: null, height: 40 })).toBeUndefined()
    expect(toImage({ url: '/media/a.png', alt: null, width: 120, height: 40 })).toBeUndefined()
    expect(toImage({ url: null, alt: 'A', width: 120, height: 40 })).toBeUndefined()
  })
})

describe('a page authored with an image round-trips through the Local API', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    await payload.delete({ collection: 'pages', where: { slug: { equals: SLUG } } })

    const png = await sharp({
      create: { width: 120, height: 40, channels: 3, background: { r: 20, g: 20, b: 20 } },
    })
      .png()
      .toBuffer()

    const media = await payload.create({
      collection: 'media',
      data: { alt: 'Northwind logo' },
      file: { data: png, mimetype: 'image/png', name: 'northwind.png', size: png.byteLength },
    })

    mediaId = media.id
  })

  afterAll(async () => {
    await payload.delete({ collection: 'pages', where: { slug: { equals: SLUG } } })
    if (mediaId) await payload.delete({ collection: 'media', id: mediaId })
  })

  it('stores width, height and alt on the uploaded document', async () => {
    const media = await payload.findByID({ collection: 'media', id: mediaId })

    expect(media.width).toBe(120)
    expect(media.height).toBe(40)
    expect(media.alt).toBe('Northwind logo')
    expect(media.url).toBeTruthy()
  })

  it('renders the stored image through the mapper, alongside a text-only logo', async () => {
    const created = await payload.create({
      collection: 'pages',
      data: {
        title: 'Media round trip',
        slug: SLUG,
        _status: 'published',
        sections: [
          {
            blockType: 'logoWall',
            heading: 'Trusted by',
            logos: [{ name: 'Northwind', image: mediaId }, { name: 'Acme' }],
          },
        ],
      },
    })

    const { sections, skipped } = mapPageResult(created)
    expect(skipped).toHaveLength(0)

    const row = sections[0]!.columns![0]!.blocks!.find(
      (b) => b.blockType === 'logoRow',
    ) as LogoRowBlock

    expect(row.logos[0]!.image).toMatchObject({ alt: 'Northwind logo', width: 120, height: 40 })
    expect(row.logos[0]!.image!.src).toContain('northwind')
    expect(row.logos[1]!.image).toBeUndefined()
    expect(row.logos[1]!.name).toBe('Acme')
  })

  it('emits an image Block for a hero authored with an image', async () => {
    const media = await payload.findByID({ collection: 'media', id: mediaId })
    const { sections, skipped } = mapPageResult({
      sections: [
        {
          blockType: 'heroCentered',
          heading: 'Hero with art',
          primaryCta: { label: null, href: null },
          secondaryCta: { label: null, href: null },
          image: media,
        },
      ],
    } as never)

    expect(skipped).toHaveLength(0)
    const image = sections[0]!.columns![0]!.blocks!.find((b) => b.blockType === 'image')
    expect(image).toMatchObject({ alt: 'Northwind logo', width: 120, height: 40 })
  })

  it('does not preload the hero image, which renders below the fold', async () => {
    const media = await payload.findByID({ collection: 'media', id: mediaId })
    const { sections } = mapPageResult({
      sections: [
        {
          blockType: 'heroCentered',
          heading: 'Hero with art',
          primaryCta: { label: null, href: null },
          secondaryCta: { label: null, href: null },
          image: media,
        },
      ],
    } as never)

    const image = sections[0]!.columns![0]!.blocks!.find((b) => b.blockType === 'image')
    expect((image as { priority?: boolean }).priority).toBeUndefined()
  })

  it('drops an incomplete logo row but keeps the rest of the wall', () => {
    const { sections, skipped } = mapPageResult({
      sections: [{ blockType: 'logoWall', logos: [{ name: '' }, { name: 'Acme' }] }],
    } as never)

    expect(skipped).toHaveLength(0)
    const row = sections[0]!.columns![0]!.blocks!.find(
      (b) => b.blockType === 'logoRow',
    ) as LogoRowBlock
    expect(row.logos.map((l) => l.name)).toEqual(['Acme'])
  })

  it('warns rather than staying silent when media cannot be rendered', () => {
    const { sections, warnings } = mapPageResult({
      sections: [{ blockType: 'logoWall', logos: [{ name: 'Acme', image: 999 }] }],
    } as never)

    expect(sections).toHaveLength(1)
    expect(warnings[0]!.blockType).toBe('logoWall')
    expect(warnings[0]!.reason).toContain('not populated')
  })

  it('keeps the Section when a relationship comes back unpopulated', () => {
    const { sections, skipped } = mapPageResult({
      sections: [{ blockType: 'logoWall', logos: [{ name: 'Acme', image: 999 }] }],
    } as never)

    expect(skipped).toHaveLength(0)
    const row = sections[0]!.columns![0]!.blocks!.find(
      (b) => b.blockType === 'logoRow',
    ) as LogoRowBlock
    expect(row.logos[0]!.image).toBeUndefined()
  })
})

describe('arrays of media', () => {
  it('generates upload rows rather than raw url fields', () => {
    const fields = fieldsFromSchema(z.object({ gallery: z.array(imageArgs) }))
    const rows = (byName(fields, 'gallery').fields as Field[])[0] as never as Record<
      string,
      unknown
    >

    expect(rows).toMatchObject({ type: 'upload', relationTo: 'media' })
  })
})
