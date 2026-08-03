'use client'

import type { ControllerRenderProps } from 'react-hook-form'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useSectionTheme } from '@/components/ds/section/section-theme-context'
import type { FieldConfig, FormValues } from '@/lib/forms/types'

export interface FieldControlProps {
  config: FieldConfig
  field: ControllerRenderProps<FormValues, string>
  controlId: string
  invalid: boolean
  describedBy?: string
}

const HTML_INPUT_TYPES: Partial<Record<FieldConfig['type'], string>> = {
  email: 'email',
  tel: 'tel',
}

export function TextControl({ config, field, controlId, invalid, describedBy }: FieldControlProps) {
  const { value, ...control } = field
  return (
    <Input
      {...control}
      id={controlId}
      type={HTML_INPUT_TYPES[config.type] ?? 'text'}
      placeholder={config.placeholder}
      value={String(value ?? '')}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
    />
  )
}

export function TextareaControl({
  config,
  field,
  controlId,
  invalid,
  describedBy,
}: FieldControlProps) {
  const { value, ...control } = field
  return (
    <Textarea
      {...control}
      id={controlId}
      placeholder={config.placeholder}
      value={String(value ?? '')}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
    />
  )
}

export function SelectControl({
  config,
  field,
  controlId,
  invalid,
  describedBy,
}: FieldControlProps) {
  const { value, onChange } = field
  const theme = useSectionTheme()
  return (
    <Select value={String(value ?? '')} onValueChange={onChange}>
      <SelectTrigger
        id={controlId}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
      >
        <SelectValue placeholder={config.placeholder ?? 'Choose one'} />
      </SelectTrigger>
      <SelectContent data-theme={theme}>
        {(config.options ?? []).map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function CheckboxControl({ field, controlId, invalid, describedBy }: FieldControlProps) {
  const { value, onChange, onBlur, name } = field
  return (
    <Checkbox
      id={controlId}
      name={name}
      checked={value === true}
      onCheckedChange={(checked) => onChange(checked === true)}
      onBlur={onBlur}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
    />
  )
}
