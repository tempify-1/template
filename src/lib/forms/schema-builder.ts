import { z } from 'zod'

import { assertConditionTargetsExist, isRequired, isVisible } from './conditions'
import { getAtPath, pathSegments } from './paths'
import { inputFields, type FieldConfig, type FormSchema, type FormValues } from './types'

type ShapeTree = { [key: string]: z.ZodType | ShapeTree }

function leafFor(field: FieldConfig): z.ZodType {
  return field.type === 'checkbox' ? z.boolean().optional() : z.string().optional()
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

function requiredMessageFor(field: FieldConfig): string {
  return field.requiredMessage ?? `${field.label ?? field.name} is required`
}

function isBlank(field: FieldConfig, value: unknown): boolean {
  if (field.type === 'checkbox') return value !== true
  return String(value ?? '').trim() === ''
}

export function buildSchema(fields: FieldConfig[]): FormSchema {
  assertConditionTargetsExist(fields)

  const inputs = inputFields(fields)
  const tree: ShapeTree = {}
  for (const field of inputs) {
    insert(tree, pathSegments(field.name), leafFor(field))
  }

  return toZod(tree).superRefine((raw, ctx) => {
    const values = raw as FormValues

    for (const field of inputs) {
      if (!isVisible(field, values)) continue

      const value = getAtPath(values, field.name)
      const path = pathSegments(field.name)
      const blank = isBlank(field, value)

      if (isRequired(field, values) && blank) {
        ctx.addIssue({ code: 'custom', path, message: requiredMessageFor(field) })
        continue
      }

      if (blank) continue

      if (typeof value === 'string') {
        if (field.min !== undefined && value.length < field.min) {
          ctx.addIssue({
            code: 'custom',
            path,
            message: `Must be at least ${field.min} characters`,
          })
        }

        if (field.max !== undefined && value.length > field.max) {
          ctx.addIssue({
            code: 'custom',
            path,
            message: `Must be at most ${field.max} characters`,
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
  }) as unknown as FormSchema
}
