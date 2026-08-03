import type { Block, CollectionSlug, Field } from 'payload'
import type { z } from 'zod'

export interface PayloadFieldHint {
  type?: 'textarea' | 'upload'
  relationTo?: CollectionSlug
  label?: string
  description?: string
  singular?: string
  plural?: string
  itemField?: string
  hidden?: boolean
}

const WRAPPER_KINDS = new Set(['optional', 'nullable', 'default', 'nullish', 'catch', 'readonly'])

const SUPPORTED_KINDS = new Set(['string', 'boolean', 'number', 'enum', 'object', 'array'])

type AnySchema = z.ZodType & { def: Record<string, unknown>; meta?: () => unknown }

function def(schema: z.ZodType): Record<string, unknown> {
  return (schema as AnySchema).def
}

function hintFor(schema: z.ZodType): PayloadFieldHint {
  const meta = (schema as AnySchema).meta?.() as { payload?: PayloadFieldHint } | undefined
  return meta?.payload ?? {}
}

function unwrap(schema: z.ZodType): { schema: z.ZodType; optional: boolean } {
  let current = schema
  let optional = false

  for (let depth = 0; depth < 20; depth += 1) {
    const kind = def(current).type as string
    if (!WRAPPER_KINDS.has(kind)) return { schema: current, optional }

    optional = true
    const inner = def(current).innerType as z.ZodType | undefined
    if (!inner) return { schema: current, optional }
    current = inner
  }

  throw new Error('Preset argument schema nests wrapper types more than 20 deep')
}

function boundOf(schema: z.ZodType, check: 'min_length' | 'max_length'): number | undefined {
  const checks = (def(schema).checks ?? []) as { _zod?: { def?: Record<string, unknown> } }[]

  for (const entry of checks) {
    const inner = entry._zod?.def
    if (inner?.check !== check) continue
    const bound = check === 'min_length' ? inner.minimum : inner.maximum
    if (typeof bound === 'number') return bound
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
  const kind = def(schema).type as string
  const label = hint.label ?? titleCase(name)
  const required = !optional

  if (!SUPPORTED_KINDS.has(kind)) {
    throw new Error(
      `Preset argument "${name}" uses the zod type "${kind}", which has no Payload field mapping. Add one to payload-fields.ts, or change the schema.`,
    )
  }

  const adminEntries = {
    ...(hint.description ? { description: hint.description } : {}),
    ...(hint.hidden ? { hidden: true } : {}),
  }
  const admin = Object.keys(adminEntries).length > 0 ? { admin: adminEntries } : {}

  if (hint.type === 'upload') {
    return {
      name,
      type: 'upload',
      relationTo: hint.relationTo ?? 'media',
      label,
      required,
      ...admin,
    }
  }

  if (kind === 'boolean') {
    return { name, type: 'checkbox', label, ...admin }
  }

  if (kind === 'number') {
    return { name, type: 'number', label, required, ...admin }
  }

  if (kind === 'enum') {
    const entries = (def(schema).entries ?? {}) as Record<string, string>
    return {
      name,
      type: 'select',
      label,
      required,
      options: Object.values(entries).map((value) => ({ label: titleCase(value), value })),
      ...admin,
    }
  }

  if (kind === 'object') {
    const inner = def(schema).shape as Record<string, z.ZodType>
    const allOrNone = optional
      ? Object.entries(inner)
          .filter(([, child]) => !unwrap(child).optional)
          .map(([key]) => key)
      : []

    return {
      name,
      type: 'group',
      label,
      fields: fieldsFromSchema(schema, optional),
      ...(allOrNone.length > 1
        ? {
            validate: (value: unknown) => {
              const group = (value ?? {}) as Record<string, unknown>
              const filled = allOrNone.filter((key) => {
                const entry = group[key]
                return typeof entry === 'string' ? entry.trim() !== '' : entry != null
              })
              if (filled.length === 0 || filled.length === allOrNone.length) return true
              return `Fill in every field or leave them all empty: ${allOrNone.join(', ')}.`
            },
          }
        : {}),
      ...admin,
    }
  }

  if (kind === 'array') {
    const rawElement = def(schema).element as z.ZodType
    const element = unwrap(rawElement).schema
    const minRows = boundOf(schema, 'min_length')
    const maxRows = boundOf(schema, 'max_length')
    const elementHint = { ...hintFor(element), ...hintFor(rawElement) }
    const isObjectElement =
      (def(element).type as string) === 'object' && elementHint.type !== 'upload'

    return {
      name,
      type: 'array',
      label,
      ...(minRows !== undefined && !optional ? { minRows, required: true } : {}),
      ...(maxRows !== undefined ? { maxRows } : {}),
      labels: { singular: hint.singular ?? label, plural: hint.plural ?? label },
      fields: isObjectElement
        ? fieldsFromSchema(element)
        : [fieldFor(hint.itemField ?? 'text', element)],
      ...admin,
    }
  }

  const maxLength = boundOf(schema, 'max_length')

  if (hint.type === 'textarea') {
    return { name, type: 'textarea', label, required, ...(maxLength ? { maxLength } : {}), ...admin }
  }

  return { name, type: 'text', label, required, ...(maxLength ? { maxLength } : {}), ...admin }
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
