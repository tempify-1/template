import { getAtPath } from './paths'
import type { FieldConfig, FormValues, Option } from './types'

export function resolveRowOptions(field: FieldConfig, row: FormValues): Option[] {
  if (!field.optionsFrom) return field.options ?? []
  const key = String(getAtPath(row, field.optionsFrom.field) ?? '')
  return field.optionsFrom.map[key] ?? []
}
