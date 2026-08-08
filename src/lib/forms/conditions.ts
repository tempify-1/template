import { getAtPath } from './paths'
import { inputFields, type Condition, type FieldConfig, type FormValues } from './types'

export function assertConditionTargetsExist(fields: FieldConfig[], extraKnown: string[] = []): void {
  const known = new Set([...inputFields(fields).map((field) => field.name), ...extraKnown])

  for (const field of fields) {
    for (const [kind, condition] of [
      ['showWhen', field.showWhen],
      ['enableWhen', field.enableWhen],
      ['requiredWhen', field.requiredWhen],
    ] as const) {
      if (condition && !known.has(condition.field)) {
        throw new Error(
          `Field "${field.name}" has a ${kind} condition targeting "${condition.field}", which is not a field in this form. Known fields: ${[...known].join(', ')}`,
        )
      }
    }

    if ((field.type === 'fieldArray' || field.type === 'cardArray') && field.fields) {
      assertConditionTargetsExist(field.fields)
    }

    if (field.type === 'combobox' && field.fields) {
      assertConditionTargetsExist(field.fields, ['value', 'label'])
    }
  }
}

export function conditionHolds(condition: Condition | undefined, values: FormValues): boolean {
  if (!condition) return true

  const raw = getAtPath(values, condition.field)
  const value =
    raw !== null && typeof raw === 'object' && !Array.isArray(raw) && 'value' in raw
      ? (raw as { value: unknown }).value
      : raw

  if ('equals' in condition) {
    return String(value ?? '') === condition.equals
  }

  if ('not_equals' in condition) {
    return String(value ?? '') !== condition.not_equals
  }

  if ('exists' in condition) {
    const present = Array.isArray(value)
      ? value.length > 0
      : typeof value === 'boolean'
        ? value
        : typeof value === 'string'
          ? value.trim().length > 0
          : value !== undefined && value !== null
    return condition.exists ? present : !present
  }

  if ('count_equals' in condition) {
    if (!Array.isArray(value)) return false
    return value.length === condition.count_equals
  }

  return true
}

export function isVisible(field: FieldConfig, values: FormValues): boolean {
  return conditionHolds(field.showWhen, values)
}

export function isRequired(field: FieldConfig, values: FormValues): boolean {
  if (!isVisible(field, values)) return false
  if (field.required) return true
  return field.requiredWhen !== undefined && conditionHolds(field.requiredWhen, values)
}

export function isEnabled(field: FieldConfig, values: FormValues): boolean {
  return conditionHolds(field.enableWhen, values)
}

export function visibleFields(fields: FieldConfig[], values: FormValues): FieldConfig[] {
  return fields.filter((field) => isVisible(field, values))
}