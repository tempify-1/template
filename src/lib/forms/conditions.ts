import { getAtPath } from './paths'
import { inputFields, type Condition, type FieldConfig, type FormValues } from './types'

export function assertConditionTargetsExist(fields: FieldConfig[]): void {
  const known = new Set(inputFields(fields).map((field) => field.name))

  for (const field of fields) {
    for (const [kind, condition] of [
      ['showWhen', field.showWhen],
      ['requiredWhen', field.requiredWhen],
    ] as const) {
      if (condition && !known.has(condition.field)) {
        throw new Error(
          `Field "${field.name}" has a ${kind} condition targeting "${condition.field}", which is not a field in this form. Known fields: ${[...known].join(', ')}`,
        )
      }
    }

    if (field.type === 'fieldArray' && field.fields) {
      assertConditionTargetsExist(field.fields)
    }
  }
}

export function conditionHolds(condition: Condition | undefined, values: FormValues): boolean {
  if (!condition) return true

  const value = getAtPath(values, condition.field)

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
