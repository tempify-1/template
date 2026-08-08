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

    case 'number': {
      const numSchema = z.number()
      let schema: z.ZodNumber = numSchema
      if (field.min !== undefined) {
        const msg = field.minMessage ?? `Must be at least ${field.min}`
        schema = schema.min(field.min, { message: msg })
      }
      if (field.max !== undefined) {
        const msg = field.maxMessage ?? `Must be at most ${field.max}`
        schema = schema.max(field.max, { message: msg })
      }
      if (field.step !== undefined) {
        const minVal = field.min ?? 0
        const stepVal = field.step
        schema = schema.refine((val) => {
          if (val === undefined) return true
          if (typeof val !== 'number') return true
          return ((val - minVal) % stepVal) === 0
        }, { message: `Must be a multiple of ${stepVal}` })
      }
      return schema.optional()
    }

    case 'combobox': {
      const tree: ShapeTree = {}
      for (const rowField of inputFields(field.fields ?? [])) {
        insert(tree, pathSegments(rowField.name), leafFor(rowField))
      }
      insert(tree, ['value'], z.string())
      insert(tree, ['label'], z.string())
      return z.array(toZod(tree)).optional()
    }

    case 'fieldArray': {
      const arrSchema = z.array(shapeFor(field.fields ?? []))
      let schema: z.ZodArray<z.ZodType> = arrSchema
      if (field.min !== undefined) {
        const msg = field.minMessage ?? `At least ${field.min} ${(field.label ?? 'rows').toLowerCase()} required`
        schema = schema.min(field.min, { message: msg })
      }
      if (field.max !== undefined) {
        const msg = field.maxMessage ?? `At most ${field.max} ${(field.label ?? 'rows').toLowerCase()} allowed`
        schema = schema.max(field.max, { message: msg })
      }
      return schema.optional()
    }

    default: {
      const strSchema = z.string()
      let schema: z.ZodString = strSchema
      // Use min as minLength for textarea, minLength for text/email/tel
      const minLength = field.type === 'textarea' ? field.min : field.minLength
      const maxLength = field.type === 'textarea' ? field.max : field.maxLength
      if (minLength !== undefined) {
        const msg = field.minMessage ?? `Must be at least ${minLength} characters`
        schema = schema.refine((val) => val === undefined || val.length === 0 || val.length >= minLength, { message: msg })
      }
      if (maxLength !== undefined) {
        const msg = field.maxMessage ?? `Must be at most ${maxLength} characters`
        schema = schema.refine((val) => val === undefined || val.length === 0 || val.length <= maxLength, { message: msg })
      }

      if (field.type === 'email') {
        schema = schema.refine((val) => val === undefined || val.length === 0 || z.string().email().safeParse(val).success, {
          message: 'Enter a valid email address',
        })
        return schema.optional()
      }

      if (field.type === 'textarea') {
        // For textarea, also check minLength/maxLength if set separately
        if (field.minLength !== undefined) {
          const len = field.minLength
          const msg = field.minMessage ?? `Must be at least ${len} characters`
          schema = schema.refine((val) => val === undefined || val.length === 0 || val.length >= len, { message: msg })
        }
        if (field.maxLength !== undefined) {
          const len = field.maxLength
          const msg = field.maxMessage ?? `Must be at most ${len} characters`
          schema = schema.refine((val) => val === undefined || val.length === 0 || val.length <= len, { message: msg })
        }
      }
      return schema.optional()
    }
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

    if (field.type === 'fieldArray' || field.type === 'combobox') {
      const rows = Array.isArray(value) ? value : []

      if (field.type === 'combobox' && isRequired(field, values) && rows.length === 0) {
        ctx.addIssue({ code: 'custom', path, message: requiredMessageFor(field) })
      }
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
        ctx.addIssue({ code: 'custom', path, message: `Must be at least ${field.min}` })
      }
      if (field.max !== undefined && value > field.max) {
        ctx.addIssue({ code: 'custom', path, message: `Must be at most ${field.max}` })
      }
      continue
    }

    if (typeof value === 'string') {
      if (field.minLength !== undefined && value.length < field.minLength) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: `Must be at least ${field.minLength} characters`,
        })
      }

      if (field.maxLength !== undefined && value.length > field.maxLength) {
        ctx.addIssue({
          code: 'custom',
          path,
          message: `Must be at most ${field.maxLength} characters`,
        })
      }

      if (field.type === 'email' && !z.string().email().safeParse(value).success) {
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