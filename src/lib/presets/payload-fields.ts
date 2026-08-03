import type { Block, Field } from 'payload'
import type { z } from 'zod'

export interface PayloadFieldHint {
  type?: 'text' | 'textarea' | 'number' | 'checkbox'
  label?: string
  description?: string
  itemField?: string
}

interface Unwrapped {
  schema: z.ZodType
  optional: boolean
}

type AnySchema = z.ZodType & { def: Record<string, unknown>; meta?: () => unknown }

function def(schema: z.ZodType): Record<string, unknown> {
  return (schema as AnySchema).def
}

function hintFor(schema: z.ZodType): PayloadFieldHint {
  const meta = (schema as AnySchema).meta?.() as { payload?: PayloadFieldHint } | undefined
  return meta?.payload ?? {}
}

function unwrap(schema: z.ZodType): Unwrapped {
  let current = schema
  let optional = false

  for (;;) {
    const kind = def(current).type
    if (kind === 'optional' || kind === 'nullable' || kind === 'default') {
      optional = true
      current = def(current).innerType as z.ZodType
      continue
    }
    return { schema: current, optional }
  }
}

function checkValue(schema: z.ZodType, name: string): number | undefined {
  const checks = (def(schema).checks ?? []) as { _zod?: { def?: Record<string, unknown> } }[]
  for (const check of checks) {
    const inner = check._zod?.def
    if (inner?.check === name) return (inner.minimum ?? inner.maximum) as number
  }
  return undefined
}

function titleCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .replace(/^./, (c) => c.toUpperCase())
}

export function fieldsFromSchema(schema: z.ZodType, blankable = false): Field[] {
  const { schema: root } = unwrap(schema)
  const shape = def(root).shape as Record<string, z.ZodType> | undefined

  if (!shape) {
    throw new Error('A Preset argument schema must be an object schema at its root')
  }

  return Object.entries(shape).map(([name, child]) => fieldFor(name, child, blankable))
}

function fieldFor(name: string, raw: z.ZodType, blankable = false): Field {
  const { schema, optional: selfOptional } = unwrap(raw)
  const optional = selfOptional || blankable
  const hint = { ...hintFor(schema), ...hintFor(raw) }
  const kind = def(schema).type
  const label = hint.label ?? titleCase(name)
  const admin = hint.description ? { description: hint.description } : undefined

  if (kind === 'boolean') {
    return { name, type: 'checkbox', label, ...(admin ? { admin } : {}) }
  }

  if (kind === 'enum') {
    const entries = Object.keys((def(schema).entries ?? {}) as Record<string, string>)
    return {
      name,
      type: 'select',
      label,
      required: !optional,
      options: entries.map((value) => ({ label: titleCase(value), value })),
      ...(admin ? { admin } : {}),
    }
  }

  if (kind === 'object') {
    return {
      name,
      type: 'group',
      label,
      fields: fieldsFromSchema(schema, optional),
      ...(admin ? { admin } : {}),
    }
  }

  if (kind === 'array') {
    const { schema: element } = unwrap(def(schema).element as z.ZodType)
    const minRows = checkValue(schema, 'min_length')
    const isObjectElement = def(element).type === 'object'

    return {
      name,
      type: 'array',
      label,
      ...(minRows !== undefined ? { minRows } : {}),
      labels: { singular: titleCase(name).replace(/e?s$/, ''), plural: titleCase(name) },
      fields: isObjectElement
        ? fieldsFromSchema(element)
        : [fieldFor(hint.itemField ?? 'text', element)],
      ...(admin ? { admin } : {}),
    }
  }

  if (kind === 'number') {
    return { name, type: 'number', label, required: !optional, ...(admin ? { admin } : {}) }
  }

  const required = !optional && (checkValue(schema, 'min_length') ?? 0) > 0

  if (hint.type === 'textarea') {
    return { name, type: 'textarea', label, required, ...(admin ? { admin } : {}) }
  }

  return { name, type: 'text', label, required, ...(admin ? { admin } : {}) }
}

export interface BlockFromSchemaOptions {
  slug: string
  schema: z.ZodType
  singular: string
  plural: string
  interfaceName?: string
}

export function blockFromSchema({
  slug,
  schema,
  singular,
  plural,
  interfaceName,
}: BlockFromSchemaOptions): Block {
  return {
    slug,
    interfaceName: interfaceName ?? `${slug.charAt(0).toUpperCase()}${slug.slice(1)}Block`,
    labels: { singular, plural },
    fields: fieldsFromSchema(schema),
  }
}
