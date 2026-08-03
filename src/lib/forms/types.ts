import type { z } from 'zod'

export const FIELD_TYPES = [
  'text',
  'email',
  'tel',
  'textarea',
  'select',
  'checkbox',
  'submit',
] as const

export type FieldType = (typeof FIELD_TYPES)[number]

export interface Option {
  label: string
  value: string
}

export type Condition = { field: string; equals: string } | { field: string; notEmpty: true }

export interface FieldConfig {
  name: string
  type: FieldType
  label?: string
  description?: string
  placeholder?: string
  required?: boolean
  requiredMessage?: string
  options?: Option[]
  min?: number
  max?: number
  showWhen?: Condition
  requiredWhen?: Condition
}

export type FormValues = Record<string, string | boolean>

export type ValueResolver = (current: FormValues) => FormValues | Promise<FormValues>

export type FormSchema = z.ZodType<FormValues, FormValues>

export function isInputField(field: FieldConfig): boolean {
  return field.type !== 'submit'
}

export function defaultValueFor(field: FieldConfig): string | boolean {
  return field.type === 'checkbox' ? false : ''
}
