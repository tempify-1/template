import { describe, it, expect } from 'vitest'

import { FIXTURE_NAMES, isFixtureName, presetFixtures } from '@/fixtures/presets'
import { presetRegistry } from '@/lib/presets/registry'
import { decodeSections, MAX_ENCODED_LENGTH } from '@/lib/preview-config'
import type { SectionDefinition } from '@/lib/presets/types'

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

describe('every Preset has a Fixture', () => {
  it('covers each registered Preset, so a new one cannot ship without a worked example', () => {
    expect(FIXTURE_NAMES.sort()).toEqual(Object.keys(presetRegistry).sort())
  })

  it('names no Fixture that is not a registered Preset', () => {
    for (const name of FIXTURE_NAMES) expect(presetRegistry).toHaveProperty(name)
  })

  it('gives every Fixture a renderable Section with at least one block', () => {
    for (const name of FIXTURE_NAMES) {
      const section = presetFixtures[name]
      const blocks = (section.columns ?? []).flatMap((column) => column.blocks ?? [])

      expect(blocks.length, name).toBeGreaterThan(0)
    }
  })

  it('survives JSON serialization, so a Fixture can be posted to the preview route', () => {
    expect(JSON.parse(JSON.stringify(presetFixtures))).toEqual(presetFixtures)
  })

  it('recognises a Fixture name and rejects anything else', () => {
    for (const name of FIXTURE_NAMES) expect(isFixtureName(name)).toBe(true)
    for (const other of ['', 'constructor', '__proto__', 'nope']) {
      expect(isFixtureName(other), other).toBe(false)
    }
  })
})

describe('the posted configuration decoder', () => {
  const section: SectionDefinition = {
    tag: 'section',
    columns: [{ blocks: [{ blockType: 'heading', level: 2, text: 'Hello' }] }],
  }

  it('round-trips a Fixture', () => {
    for (const name of FIXTURE_NAMES) {
      expect(decodeSections(encode(presetFixtures[name])), name).toEqual([presetFixtures[name]])
    }
  })

  it('accepts a single Section or a list of them', () => {
    expect(decodeSections(encode(section))).toEqual([section])
    expect(decodeSections(encode([section, section]))).toHaveLength(2)
  })

  it('refuses a block type the renderer does not know', () => {
    const unknown = { tag: 'section', columns: [{ blocks: [{ blockType: 'evil', html: '<x>' }] }] }

    expect(decodeSections(encode(unknown))).toBeNull()
  })

  it('refuses a block with no blockType at all', () => {
    expect(decodeSections(encode({ columns: [{ blocks: [{ text: 'orphan' }] }] }))).toBeNull()
  })

  it('refuses something that is not base64, or not JSON', () => {
    expect(decodeSections('not-base64-at-all!!')).toBeNull()
    expect(decodeSections(Buffer.from('{ nope').toString('base64url'))).toBeNull()
  })

  it('refuses a payload larger than the cap rather than rendering it', () => {
    const huge = encode({
      tag: 'section',
      columns: [
        { blocks: [{ blockType: 'heading', level: 2, text: 'x'.repeat(MAX_ENCODED_LENGTH) }] },
      ],
    })

    expect(huge.length).toBeGreaterThan(MAX_ENCODED_LENGTH)
    expect(decodeSections(huge)).toBeNull()
  })
})
