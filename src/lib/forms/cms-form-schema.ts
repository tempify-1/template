import { z } from 'zod'

export const CMS_FIELD_TYPES = [
  'text',
  'email',
  'tel',
  'textarea',
  'select',
  'checkbox',
  'number',
] as const

export type CmsFieldType = (typeof CMS_FIELD_TYPES)[number]

const cmsFieldTypeEnum = z.enum([...CMS_FIELD_TYPES] as [CmsFieldType, ...CmsFieldType[]])

export const optionSchema = z.object({
  label: z.string(),
  value: z.string(),
})

export const cmsFieldSchema = z.object({
  name: z.string(),
  type: cmsFieldTypeEnum,
  label: z.string().optional(),
  placeholder: z.string().optional(),
  description: z.string().optional(),
  required: z.boolean().optional(),
  options: z.array(optionSchema).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
})

export const cmsFormSchema = z.object({
  name: z.string(),
  slug: z.string(),
  submitLabel: z.string(),
  successMessage: z.string(),
  summaryField: z.string(),
  fields: z.array(cmsFieldSchema),
})

export type CmsFieldInput = z.input<typeof cmsFieldSchema>
export type CmsFormInput = z.input<typeof cmsFormSchema>
