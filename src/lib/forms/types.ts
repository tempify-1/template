import type { z } from 'zod'

export const FIELD_TYPES = [
  'text',
  'email',
  'tel',
  'textarea',
  'select',
  'searchableSelect',
  'combobox',
  'checkbox',
  'number',
  'fieldArray',
  'submit',
] as const

export type FieldType = (typeof FIELD_TYPES)[number]

export interface Option {
  label: string
  value: string
  disabled?: boolean
}

export type Condition =
  | { field: string; equals: string }
  | { field: string; not_equals: string }
  | { field: string; exists: boolean }
  | { field: string; count_equals: number }

export interface PickerOption extends Option {
  data?: FormValues
}

export interface CardDisplayConfig {
  title?: string | string[]
  description?: (string | { field?: string; text?: string })[]
  chips?: { field: string; label?: string }[]
  addable?: boolean
  removable?: boolean
  showCompletionStatus?: boolean
}

export interface FieldConfig {
  name: string
  type: FieldType
  label?: string
  description?: string
  placeholder?: string
  required?: boolean
  requiredMessage?: string
  options?: Option[]
  optionSource?: (query: string, signal: AbortSignal) => Promise<Option[]>
  min?: number
  max?: number
  minMessage?: string
  maxMessage?: string
  minLength?: number
  maxLength?: number
  step?: number
  autocomplete?: string
  inputmode?: string
  enterkeyhint?: string
  ariaLabel?: string
  ariaDescribedby?: string
  ariaDescription?: string
  tabIndex?: number
  fields?: FieldConfig[]
  singularLabel?: string
  reselectOptions?: boolean
  editableOptions?: boolean
  draggable?: boolean
  cardDisplay?: CardDisplayConfig
  showWhen?: Condition
  enableWhen?: Condition
  requiredWhen?: Condition
  picker?: {
    label?: string
    options: PickerOption[]
  }
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
  if (field.type === 'combobox') return []
  if (field.type === 'number') return undefined
  if (field.type === 'searchableSelect' && field.optionSource) return undefined
  return ''
}