import { CMS_FIELD_TYPES, type CmsFieldType } from './cms-form-schema'
import type { FormDefinition } from './definitions'
import type { FieldConfig, FieldType } from './types'

interface CmsFieldRow {
  name: string
  type: string
  label?: string | null
  placeholder?: string | null
  description?: string | null
  required?: boolean | null
  options?: Array<{ label: string; value: string }> | null
  min?: number | null
  max?: number | null
}

interface CmsFormDoc {
  name: string
  slug: string
  submitLabel: string
  successMessage: string
  summaryField: string
  fields?: CmsFieldRow[] | null
}

function mapField(row: CmsFieldRow): FieldConfig | null {
  if (!CMS_FIELD_TYPES.includes(row.type as CmsFieldType)) {
    return null
  }

  const type = row.type as FieldType
  const field: FieldConfig = { name: row.name, type }

  if (row.label) field.label = row.label
  if (row.placeholder) field.placeholder = row.placeholder
  if (row.description) field.description = row.description
  if (row.required === true) field.required = true

  if (type === 'select' && row.options && row.options.length > 0) {
    field.options = row.options.map((option) => ({
      label: option.label,
      value: option.value,
    }))
  }

  if (row.min != null) field.min = row.min
  if (row.max != null) field.max = row.max

  return field
}

export function mapCmsForm(doc: CmsFormDoc): FormDefinition | null {
  const rows = doc.fields ?? []
  if (rows.length === 0) return null

  const fields: FieldConfig[] = []
  for (const row of rows) {
    const field = mapField(row)
    if (!field) return null
    fields.push(field)
  }

  const fieldNames = new Set(fields.map((field) => field.name))
  if (!fieldNames.has(doc.summaryField)) return null

  return {
    fields,
    submitLabel: doc.submitLabel,
    successMessage: doc.successMessage,
    summaryField: doc.summaryField,
  }
}
