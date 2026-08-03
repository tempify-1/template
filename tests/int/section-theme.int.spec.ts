import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, it, expect } from 'vitest'

import { heroCentered } from '@/lib/presets/hero-centered'
import { presetBlocks, presetRegistry } from '@/lib/presets/registry'
import { SECTION_THEMES, isSectionTheme, themed } from '@/lib/presets/theme'
import { mapPageResult } from '@/mappers/page'
import type { Field } from 'payload'

const themeCss = readFileSync(
  join(process.cwd(), 'src/components/ds/section/section-themes.css'),
  'utf8',
)

function themeField(slug: string) {
  const block = presetBlocks().find((entry) => entry.slug === slug)!
  return block.fields.find((field) => 'name' in field && field.name === 'theme') as never as {
    type: string
    options: { value: string }[]
  }
}

describe('Theme set', () => {
  it('carries no palette names', () => {
    for (const theme of SECTION_THEMES) {
      expect(theme).not.toMatch(/blue|slate|zinc|neutral|gray|grey|red|green|indigo|stone/i)
    }
  })

  it('defines a light and a dark pairing for every Theme', () => {
    for (const theme of SECTION_THEMES) {
      expect(themeCss).toContain(`[data-theme='${theme}'] {`)
      expect(themeCss).toContain(`.dark [data-theme='${theme}'] {`)
    }
  })

  it('overrides the same token set in both pairings, so nothing is half-themed', () => {
    for (const theme of SECTION_THEMES) {
      const light = themeCss.split(`[data-theme='${theme}'] {`)[1]!.split('}')[0]!
      const dark = themeCss.split(`.dark [data-theme='${theme}'] {`)[1]!.split('}')[0]!

      const tokensIn = (block: string) =>
        [...block.matchAll(/--([\w-]+):/g)].map((m) => m[1]).sort()

      expect(tokensIn(dark)).toEqual(tokensIn(light))
      expect(tokensIn(light)).toContain('background')
      expect(tokensIn(light)).toContain('foreground')
    }
  })
})

describe('authoring a Section Theme', () => {
  it('offers the Theme on every generated block, so no Preset can be left out', () => {
    for (const slug of Object.keys(presetRegistry)) {
      const field = themeField(slug)

      expect(field, slug).toBeDefined()
      expect(field.type).toBe('select')
      expect(field.options.map((option) => option.value)).toEqual([...SECTION_THEMES])
    }
  })

  it('leaves the Theme optional, so an unthemed Section stays on the page Theme', () => {
    const field = themeField('heroCentered') as unknown as Field & { required?: boolean }

    expect(field.required).toBeFalsy()
  })

  it('carries a stored Theme onto the Section it was authored on', () => {
    const { sections } = mapPageResult({
      sections: [
        { blockType: 'ctaBanner', heading: 'Ready?', theme: 'brand' },
        { blockType: 'community', heading: 'Join us' },
      ],
    } as never)

    expect(sections[0]!.theme).toBe('brand')
    expect(sections[1]!.theme).toBeUndefined()
  })

  it('ignores a Theme the set no longer contains rather than stamping it', () => {
    const { sections } = mapPageResult({
      sections: [{ blockType: 'ctaBanner', heading: 'Ready?', theme: 'sunset' }],
    } as never)

    expect(sections[0]!.theme).toBeUndefined()
  })

  it('sets the Theme without disturbing the Section it wraps', () => {
    const section = heroCentered({ heading: 'Hello' })

    expect(themed('muted', section)).toEqual({ ...section, theme: 'muted' })
    expect(section.theme).toBeUndefined()
  })

  it('recognises every Theme in the set and nothing else', () => {
    for (const theme of SECTION_THEMES) expect(isSectionTheme(theme)).toBe(true)
    for (const other of ['blue', '', 'Muted', null, 7]) expect(isSectionTheme(other)).toBe(false)
  })
})

describe('components never name a colour', () => {
  const PALETTES =
    'slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
  const paletteClass = new RegExp(
    `\\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|shadow|accent|caret|divide)-(?:${PALETTES})-\\d`,
  )
  const literalColour = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|color-mix)\(/

  function componentSources(): { path: string; source: string }[] {
    const root = join(process.cwd(), 'src/components/ds')
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = join(dir, entry.name)
        if (entry.isDirectory()) return walk(full)
        return /\.(tsx?|css)$/.test(entry.name) ? [full] : []
      })

    return walk(root)
      .filter((path) => !path.endsWith('section-themes.css'))
      .map((path) => ({
        path: path.replace(`${process.cwd()}/`, ''),
        source: readFileSync(path, 'utf8'),
      }))
  }

  it('uses no palette-named utility anywhere in the design system', () => {
    const offenders = componentSources()
      .filter(({ source }) => paletteClass.test(source))
      .map(({ path }) => path)

    expect(offenders).toEqual([])
  })

  it('writes no literal colour value outside the Theme definitions', () => {
    const offenders = componentSources()
      .filter(({ source }) => literalColour.test(source))
      .map(({ path }) => path)

    expect(offenders).toEqual([])
  })
})
