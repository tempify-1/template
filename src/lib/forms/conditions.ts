import type { Condition, FieldConfig, FormValues } from './types'

export function conditionHolds(condition: Condition | undefined, values: FormValues): boolean {
  if (!condition) return true

  const value = values[condition.field]

  if ('notEmpty' in condition) {
    if (typeof value === 'boolean') return value
    return typeof value === 'string' && value.trim().length > 0
  }

  return String(value ?? '') === condition.equals
}

export function isVisible(field: FieldConfig, values: FormValues): boolean {
  return conditionHolds(field.showWhen, values)
}

export function isRequired(field: FieldConfig, values: FormValues): boolean {
  if (!isVisible(field, values)) return false
  if (field.required) return true
  return field.requiredWhen !== undefined && conditionHolds(field.requiredWhen, values)
}

export function visibleFields(fields: FieldConfig[], values: FormValues): FieldConfig[] {
  return fields.filter((field) => isVisible(field, values))
}
