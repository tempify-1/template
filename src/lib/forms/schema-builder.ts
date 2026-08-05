import { z } from 'zod'

import { assertConditionTargetsExist, isRequired, isVisible } from './conditions'
import { getAtPath, pathSegments } from './paths'
import { inputFields, type FieldConfig, type FormSchema, type FormValues } from './types'

type ShapeTree = { [key: string]: z.ZodType | ShapeTree }

type IssuePath = (string | number)[]
type IssueSink = { addIssue: (issue: { code: 'custom'; path: IssuePath; message: string }) => void }

function leafFor(field: FieldConfig): z.ZodType {
  switch (field.type) {
    case 'checkbox':
      return z.boolean().optional()
    case 'number':
      return z.number().optional()
    case 'fieldArray':
      return z.array(shapeFor(field.fields ?? [])).optional()
    default:
      return z.string().optional()
  }
}

function insert(tree: ShapeTree, segments: string[], schema: z.ZodType): void {
  const [head, ...rest] = segments
  if (!head) return

  if (rest.length === 0) {
    tree[head] = schema
    return
  }

  const existing = tree[head]
  const branch: ShapeTree = existing && !('safeParse' in existing) ? (existing as ShapeTree) : {}
  tree[head] = branch
  insert(branch, rest, schema)
}

function toZod(tree: ShapeTree): z.ZodType {
  const shape: Record<string, z.ZodType> = {}

  for (const [key, value] of Object.entries(tree)) {
    shape[key] = 'safeParse' in value ? (value as z.ZodType) : toZod(value as ShapeTree).optional()
  }

  return z.object(shape)
}

function shapeFor(fields: FieldConfig[]): z.ZodType {
  const tree: ShapeTree = {}
  for (const field of inputFields(fields)) {
    insert(tree, pathSegments(field.name), leafFor(field))
  }
  return toZod(tree)
}

function requiredMessageFor(field: FieldConfig): string {
  return field.requiredMessage ?? `${field.label ?? field.name} is required`
}

function isBlank(field: FieldConfig, value: unknown): boolean {
  if (field.type === 'checkbox') return value !== true
  return String(value ?? '').trim() === ''
}

function minMessageFor(field: FieldConfig): string {
  return (
    field.minMessage ?? `At least ${field.min} ${(field.label ?? 'rows').toLowerCase()} required`
  )
}

function maxMessageFor(field: FieldConfig): string {
  return field.maxMessage ?? `At most ${field.max} ${(field.label ?? 'rows').toLowerCase()} allowed`
}

function minNumberMessage(field: FieldConfig): string {
  return field.minMessage ?? `Must be at least ${field.min}`
}

function maxNumberMessage(field: FieldConfig): string {
  return field.maxMessage ?? `Must be at most ${field.max}`
}

function minLengthMessage(field: FieldConfig): string {
  return field.minMessage ?? `Must be at least ${field.min} characters`
}

function maxLengthMessage(field: FieldConfig): string {
  return field.maxMessage ?? `Must be at most ${field.max} characters`
}

function refineFields(
  fields: FieldConfig[],
  values: FormValues,
  basePath: IssuePath,
  ctx: IssueSink,
): void {
  for (const field of inputFields(fields)) {
    if (!isVisible(field, values)) continue

    const value = getAtPath(values, field.name)
    const path = [...basePath, ...pathSegments(field.name)]

    if (field.type === 'fieldArray') {
      const rows = Array.isArray(value) ? value : []

      if (field.min !== undefined && rows.length < field.min) {
        ctx.addIssue({ code: 'custom', path, message: minMessageFor(field) })
      }
      if (field.max !== undefined && rows.length > field.max) {
        ctx.addIssue({ code: 'custom', path, message: maxMessageFor(field) })
      }

      rows.forEach((row, index) => {
        if (row !== null && typeof row === 'object' && !Array.isArray(row)) {
          refineFields(field.fields ?? [], row as FormValues, [...path, index], ctx)
        }
      })
      continue
    }

    const blank = isBlank(field, value)

    if (isRequired(field, values) && blank) {
      ctx.addIssue({ code: 'custom', path, message: requiredMessageFor(field) })
      continue
    }

    if (blank) continue

    if (field.type === 'number') {
      if (typeof value !== 'number') continue

      if (field.min !== undefined && value < field.min) {
        ctx.addIssue({ code: 'custom', path, message: minNumberMessage(field) })
      }
      if (field.max !== undefined && value > field.max) {
        ctx.addIssue({ code: 'custom', path, message: maxNumberMessage(field) })
      }
      continue
    }

    if (typeof value === 'string') {
      if (field.min !== undefined && value.length < field.min) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: minLengthMessage(field),
        })
      }

      if (field.max !== undefined && value.length > field.max) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: maxLengthMessage(field),
        })
      }

      if (field.type === 'email' && !z.email().safeParse(value).success) {
        ctx.addIssue({ code: 'custom', path, message: 'Enter a valid email address' })
      }

      if (
        field.type === 'select' &&
        field.options &&
        !field.options.some((o) => o.value === value)
      ) {
        ctx.addIssue({ code: 'custom', path, message: 'Choose one of the available options' })
      }
    }
  }
}

export function buildSchema(fields: FieldConfig[]): FormSchema {
  assertConditionTargetsExist(fields)

  return shapeFor(fields).superRefine((raw, ctx) => {
    refineFields(fields, raw as FormValues, [], ctx)
  }) as unknown as FormSchema
}
