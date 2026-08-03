import { z } from 'zod'

import { isRequired, isVisible } from './conditions'
import { isInputField, type FieldConfig, type FormSchema, type FormValues } from './types'

function baseSchemaFor(field: FieldConfig) {
  if (field.type === 'checkbox') return z.boolean()

  let schema = z.string()
  if (field.min !== undefined) schema = schema.min(field.min, `Must be at least ${field.min} characters`)
  if (field.max !== undefined) schema = schema.max(field.max, `Must be at most ${field.max} characters`)
  return schema
}

function requiredMessageFor(field: FieldConfig): string {
  return field.requiredMessage ?? `${field.label ?? field.name} is required`
}

export function buildSchema(fields: FieldConfig[]): FormSchema {
  const inputs = fields.filter(isInputField)

  const shape: Record<string, z.ZodType> = {}
  for (const field of inputs) {
    shape[field.name] = baseSchemaFor(field)
  }

  return z.object(shape).superRefine((raw, ctx) => {
    const values = raw as FormValues

    for (const field of inputs) {
      if (!isVisible(field, values)) continue

      const value = values[field.name]

      if (isRequired(field, values)) {
        const empty = field.type === 'checkbox' ? value !== true : String(value ?? '').trim() === ''
        if (empty) {
          ctx.addIssue({
            code: 'custom',
            path: [field.name],
            message: requiredMessageFor(field),
          })
          continue
        }
      }

      if (field.type === 'email' && typeof value === 'string' && value.trim() !== '') {
        if (!z.email().safeParse(value).success) {
          ctx.addIssue({
            code: 'custom',
            path: [field.name],
            message: 'Enter a valid email address',
          })
        }
      }

      if (field.type === 'select' && field.options && typeof value === 'string' && value !== '') {
        if (!field.options.some((option) => option.value === value)) {
          ctx.addIssue({
            code: 'custom',
            path: [field.name],
            message: 'Choose one of the available options',
          })
        }
      }
    }
  }) as unknown as FormSchema
}
