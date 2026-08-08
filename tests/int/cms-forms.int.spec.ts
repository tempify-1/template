import { describe, it, expect } from 'vitest'

import { CMS_FIELD_TYPES } from '@/lib/forms/cms-form-schema'
import { mapCmsForm } from '@/lib/forms/map-cms-form'

const validForm = {
  name: 'Test',
  slug: 'test',
  submitLabel: 'Send',
  successMessage: 'Thanks.',
  summaryField: 'email',
  fields: [
    { name: 'name', type: 'text', label: 'Name', required: true },
    { name: 'email', type: 'email', label: 'Email', required: true },
    { name: 'phone', type: 'tel', label: 'Phone' },
    { name: 'message', type: 'textarea', label: 'Message' },
    { name: 'source', type: 'select', label: 'Source', options: [{ label: 'Web', value: 'web' }] },
    { name: 'consent', type: 'checkbox', label: 'Consent' },
    { name: 'budget', type: 'number', label: 'Budget', min: 0, max: 100 },
  ],
}

describe('mapCmsForm', () => {
  it('converts every allowed field type into a FieldConfig', () => {
    const definition = mapCmsForm(validForm)

    expect(definition).not.toBeNull()
    expect(definition!.fields.map((field) => field.type)).toEqual([
      'text',
      'email',
      'tel',
      'textarea',
      'select',
      'checkbox',
      'number',
    ])
  })

  it('carries options, bounds and labels through to the engine', () => {
    const definition = mapCmsForm(validForm)

    const source = definition!.fields.find((field) => field.name === 'source')
    expect(source).toMatchObject({
      type: 'select',
      options: [{ label: 'Web', value: 'web' }],
    })

    const budget = definition!.fields.find((field) => field.name === 'budget')
    expect(budget).toMatchObject({ type: 'number', min: 0, max: 100 })
  })

  it('returns null when a field type is outside the allowlist', () => {
    const bad = {
      ...validForm,
      fields: [{ name: 'rooms', type: 'fieldArray', label: 'Rooms' }],
    }

    expect(mapCmsForm(bad)).toBeNull()
  })

  it('returns null when the summary field does not exist', () => {
    const bad = { ...validForm, summaryField: 'missing' }

    expect(mapCmsForm(bad)).toBeNull()
  })
})

describe('CMS field allowlist', () => {
  it('contains only flat field types the engine can render', () => {
    expect(CMS_FIELD_TYPES).toEqual([
      'text',
      'email',
      'tel',
      'textarea',
      'select',
      'checkbox',
      'switch',
      'number',
      'date',
      'color',
      'range',
      'multiSelect',
      'radioCards',
      'radioTabs',
      'checkboxCards',
    ])
    expect(CMS_FIELD_TYPES).not.toContain('fieldArray')
  })
})

describe('an editor-authored form reaches a public visitor', () => {
  it('populates the form relationship for an anonymous read', async () => {
    const { getPayload } = await import('payload')
    const config = (await import('@/payload.config')).default
    const payload = await getPayload({ config: await config })

    const slug = `anon-${Date.now()}`
    await payload.create({
      collection: 'forms',
      data: {
        name: 'Anon',
        slug,
        _status: 'published',
        submitLabel: 'Go',
        successMessage: 'ok',
        summaryField: 'email',
        fields: [{ name: 'email', type: 'email', label: 'Email', required: true }],
      } as never,
    })
    const form = await payload.find({
      collection: 'forms',
      where: { slug: { equals: slug } },
      limit: 1,
      overrideAccess: true,
    })
    const page = await payload.create({
      collection: 'pages',
      data: {
        title: 'Anon',
        slug,
        _status: 'published',
        sections: [{ blockType: 'cmsForm', heading: 'Anon', form: form.docs[0]!.id }],
      } as never,
    })

    try {
      // exactly how a public page render reads it: no user, access enforced
      const { docs } = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        limit: 1,
        draft: false,
        overrideAccess: false,
      })
      const block = (docs[0] as never as { sections: { form: unknown }[] }).sections[0]!

      expect(
        typeof block.form === 'object' && block.form !== null,
        'the form relationship must populate for an anonymous reader, or the mapper drops the whole Section',
      ).toBe(true)
    } finally {
      await payload.delete({ collection: 'pages', id: page.id })
      await payload.delete({ collection: 'forms', where: { slug: { equals: slug } } })
    }
  })
})

describe('the client boundary', () => {
  it('keeps the form Block free of any module that imports Payload', async () => {
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const source = readFileSync(
      join(process.cwd(), 'src/components/ds/section/form-block.tsx'),
      'utf8',
    )

    expect(source.startsWith("'use client'")).toBe(true)
    expect(
      source,
      'importing resolve-form pulls the whole Payload server graph into the client bundle and 500s the page',
    ).not.toContain('resolve-form')
  })
})

describe('the flat newcomers are CMS-authorable (#73)', () => {
  const rows = [
    { name: 'optIn', type: 'switch', label: 'Opt in' },
    { name: 'when', type: 'date', label: 'When' },
    { name: 'shade', type: 'color', label: 'Shade' },
    { name: 'level', type: 'range', label: 'Level', min: 0, max: 5 },
    {
      name: 'tags',
      type: 'multiSelect',
      label: 'Tags',
      options: [{ label: 'A', value: 'a' }],
    },
    {
      name: 'plan',
      type: 'radioCards',
      label: 'Plan',
      options: [{ label: 'Basic', value: 'basic' }],
    },
    {
      name: 'view',
      type: 'radioTabs',
      label: 'View',
      options: [{ label: 'List', value: 'list' }],
    },
    {
      name: 'meals',
      type: 'checkboxCards',
      label: 'Meals',
      options: [{ label: 'BB', value: 'bb' }],
    },
  ]

  it('maps every admitted type with its options intact', () => {
    const definition = mapCmsForm({
      name: 'Newcomers',
      slug: 'newcomers',
      submitLabel: 'Go',
      successMessage: 'ok',
      summaryField: 'optIn',
      fields: rows,
    })
    if (!definition) throw new Error('expected a definition')
    expect(definition.fields.map((f) => f.type)).toEqual([
      'switch',
      'date',
      'color',
      'range',
      'multiSelect',
      'radioCards',
      'radioTabs',
      'checkboxCards',
    ])
    expect(definition.fields.find((f) => f.name === 'plan')?.options).toEqual([
      { label: 'Basic', value: 'basic' },
    ])
    expect(definition.fields.find((f) => f.name === 'level')?.min).toBe(0)
  })

  it('rejects a document carrying an inadmissible type outright', () => {
    const definition = mapCmsForm({
      name: 'X',
      slug: 'x',
      submitLabel: 'Go',
      successMessage: 'ok',
      summaryField: 'ok',
      fields: [{ name: 'p', type: 'password' }, { name: 'ok', type: 'text' }],
    })
    expect(definition).toBeNull()
  })
})
