import type { z } from 'zod'

export const FIELD_TYPES = [
  'text',
  'email',
  'tel',
  'textarea',
  'select',
  'checkbox',
  'number',
  'fieldArray',
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
  fields?: FieldConfig[]
  showWhen?: Condition
  requiredWhen?: Condition
}

export type FormValue = string | number | boolean | undefined | FormValues | FormValueArray

export interface FormValues {
  [key: string]: FormValue
}

export interface FormValueArray extends Array<FormValue> {
  __formValueArray?: never
}

export type ValueResolver = (current: FormValues) => FormValues | Promise<FormValues>

export type FormSchema = z.ZodType<FormValues, FormValues>

export function isInputField(field: FieldConfig): boolean {
  return field.type !== 'submit'
}

export function inputFields(fields: FieldConfig[]): FieldConfig[] {
  return fields.filter(isInputField)
}

export function defaultValueFor(field: FieldConfig): FormValue {
  if (field.type === 'checkbox') return false
  if (field.type === 'fieldArray') return []
  if (field.type === 'number') return undefined
  return ''
}
