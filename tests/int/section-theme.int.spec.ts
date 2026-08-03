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

const globalsCss = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8')

const NON_SURFACE = /^(chart-|sidebar|radius|font-|color-)/

function tokensIn(block: string): string[] {
  return [...block.matchAll(/--([\w-]+):/g)].map((match) => match[1]!)
}

function blockFor(selector: string, css = themeCss): string {
  const start = css.indexOf(`${selector} {`)
  expect(start, selector).toBeGreaterThan(-1)
  return css.slice(start).split('{')[1]!.split('}')[0]!
}

const SURFACE_TOKENS = tokensIn(blockFor(':root', globalsCss)).filter(
  (token) => !NON_SURFACE.test(token),
)

const generatedBlocks = presetBlocks()

function themeField(slug: string) {
  const block = generatedBlocks.find((entry) => entry.slug === slug)!
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

  it('overrides every surface token the page defines, so nothing falls back mid-Section', () => {
    for (const theme of SECTION_THEMES) {
      for (const selector of [`[data-theme='${theme}']`, `.dark [data-theme='${theme}']`]) {
        expect(tokensIn(blockFor(selector)).sort(), selector).toEqual([...SURFACE_TOKENS].sort())
      }
    }
  })

  it('declares each token exactly once per pairing, so no override is dead', () => {
    for (const theme of SECTION_THEMES) {
      for (const selector of [`[data-theme='${theme}']`, `.dark [data-theme='${theme}']`]) {
        const declared = tokensIn(blockFor(selector))

        expect(new Set(declared).size, selector).toBe(declared.length)
      }
    }
  })
})

describe('Theme values stay on the shadcn palette', () => {
  const tailwindTheme = readFileSync(
    join(process.cwd(), 'node_modules/tailwindcss/theme.css'),
    'utf8',
  )

  function normalise(colour: string): string {
    const parts = colour
      .replace(/^oklch\(|\)$/g, '')
      .trim()
      .split(/[\s/]+/)
      .slice(0, 3)
      .map((part) =>
        part === 'none' ? 0 : part.endsWith('%') ? Number(part.slice(0, -1)) / 100 : Number(part),
      )
    return parts.map((n) => Number(n.toFixed(4))).join(' ')
  }

  const RAMP = new Set(
    [...tailwindTheme.matchAll(/--color-[\w-]+:\s*(oklch\([^)]*\))/g)].map((match) =>
      normalise(match[1]!),
    ),
  )

  const WHITE = normalise('oklch(1 0 0)')

  function valuesIn(css: string): { token: string; colour: string }[] {
    return [...css.matchAll(/--([\w-]+):\s*(oklch\([^)]*\))/g)].map((match) => ({
      token: match[1]!,
      colour: match[2]!,
    }))
  }

  it('reads a non-empty ramp from the installed Tailwind, so the check is not vacuous', () => {
    expect(RAMP.size).toBeGreaterThan(100)
    expect(RAMP.has(normalise('oklch(97% 0 none)'))).toBe(true)
  })

  it('picks every Theme colour off the ramp rather than inventing one', () => {
    const offRamp = valuesIn(themeCss).filter(
      ({ colour }) => normalise(colour) !== WHITE && !RAMP.has(normalise(colour)),
    )

    expect(offRamp).toEqual([])
  })

  it('holds the page tokens to the same ramp', () => {
    const scoped = globalsCss.slice(globalsCss.indexOf(':root'))
    const offRamp = valuesIn(scoped).filter(
      ({ colour }) => normalise(colour) !== WHITE && !RAMP.has(normalise(colour)),
    )

    expect(offRamp).toEqual([])
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

  it('ignores a Theme the set no longer contains, and says so rather than dropping it silently', () => {
    const { sections, warnings } = mapPageResult({
      sections: [{ blockType: 'ctaBanner', heading: 'Ready?', theme: 'sunset' }],
    } as never)

    expect(sections[0]!.theme).toBeUndefined()
    expect(warnings[0]!.reason).toContain('sunset')
  })

  it('stays quiet about a Section that was never given a Theme', () => {
    const { warnings } = mapPageResult({
      sections: [{ blockType: 'ctaBanner', heading: 'Ready?' }],
    } as never)

    expect(warnings).toEqual([])
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
  const literalColour =
    /#[0-9a-fA-F]{3,8}(?![0-9a-zA-Z])|\b(?:rgba?|hsla?|oklch|oklab|lab|lch)\(\s*[\d.]/

  function withoutTokenReferences(source: string): string {
    return source
      .replace(/_/g, ' ')
      .replace(/=['"]#[0-9a-fA-F]{3,8}['"]/g, '=SELECTOR')
      .replace(/var\(--[\w-]+(?:,[^()]*)?\)/g, 'TOKEN')
  }

  function componentSources(): { path: string; source: string }[] {
    const root = join(process.cwd(), 'src/components')
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

  it('uses no palette-named utility in any component a Section can render', () => {
    const offenders = componentSources()
      .filter(({ source }) => paletteClass.test(source))
      .map(({ path }) => path)

    expect(offenders).toEqual([])
  })

  it('writes no literal colour value outside the Theme definitions', () => {
    const offenders = componentSources()
      .filter(({ source }) => literalColour.test(withoutTokenReferences(source)))
      .map(({ path }) => path)

    expect(offenders).toEqual([])
  })

  it('still rejects a hex, an rgb() and a color-mix over a raw colour', () => {
    for (const violation of [
      'className="text-[#ff0000]"',
      'style={{ color: "rgb(255 0 0)" }}',
      'className="bg-[color-mix(in_oklch,var(--primary),#fff_10%)]"',
      'className="bg-[oklch(0.5_0.2_20)]"',
    ]) {
      expect(literalColour.test(withoutTokenReferences(violation)), violation).toBe(true)
    }
  })

  it('accepts a color-mix composed only of tokens and a Recharts attribute selector', () => {
    for (const allowed of [
      'hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)]',
      "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50",
    ]) {
      expect(literalColour.test(withoutTokenReferences(allowed)), allowed).toBe(false)
    }
  })
})
