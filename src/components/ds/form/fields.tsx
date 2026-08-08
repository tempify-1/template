'use client'

import React from 'react'
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
  disabled?: boolean
}

const HTML_INPUT_TYPES: Partial<Record<FieldConfig['type'], string>> = {
  email: 'email',
  tel: 'tel',
}

export function TextControl({ config, field, controlId, invalid, describedBy, disabled }: FieldControlProps) {
  const { value, ...control } = field
  const ariaDescribedBy = [describedBy, config.ariaDescribedby].filter(Boolean).join(' ')
  return (
    <Input
      {...control}
      id={controlId}
      type={HTML_INPUT_TYPES[config.type] ?? 'text'}
      placeholder={config.placeholder}
      value={String(value ?? '')}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={ariaDescribedBy || undefined}
      aria-label={config.ariaLabel}
      aria-description={config.ariaDescription}
      inputMode={config.inputmode as any}
      enterKeyHint={config.enterkeyhint as any}
      tabIndex={config.tabIndex}
      autoComplete={config.autocomplete}
    />
  )
}

export function TextareaControl({
  config,
  field,
  controlId,
  invalid,
  describedBy,
  disabled,
}: FieldControlProps) {
  const { value, ...control } = field
  const ariaDescribedBy = [describedBy, config.ariaDescribedby].filter(Boolean).join(' ')
  return (
    <Textarea
      {...control}
      id={controlId}
      placeholder={config.placeholder}
      value={String(value ?? '')}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={ariaDescribedBy || undefined}
      aria-label={config.ariaLabel}
      aria-description={config.ariaDescription}
      inputMode={config.inputmode as any}
      enterKeyHint={config.enterkeyhint as any}
      tabIndex={config.tabIndex}
      autoComplete={config.autocomplete}
    />
  )
}

export function SelectControl({
  config,
  field,
  controlId,
  invalid,
  describedBy,
  disabled,
}: FieldControlProps) {
  const { value, onChange } = field
  const theme = useSectionTheme()
  const options = config.options ?? []
  const stored = String(value ?? '')
  const chosen = options.some((option) => option.value === stored) ? stored : ''
  const ariaDescribedBy = [describedBy, config.ariaDescribedby].filter(Boolean).join(' ')

  return (
    <Select items={options} value={chosen} onValueChange={onChange}>
      <SelectTrigger
        id={controlId}
        aria-invalid={invalid || undefined}
        aria-describedby={ariaDescribedBy || undefined}
        aria-label={config.ariaLabel}
        aria-description={config.ariaDescription}
        disabled={disabled}
        tabIndex={config.tabIndex}
      >
        <SelectValue placeholder={config.placeholder ?? 'Choose one'} />
      </SelectTrigger>
      <SelectContent data-theme={theme}>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export function CheckboxControl({ config, field, controlId, invalid, describedBy, disabled }: FieldControlProps) {
  const { value, onChange, onBlur, name } = field
  const ariaDescribedBy = [describedBy, config.ariaDescribedby].filter(Boolean).join(' ')
  return (
    <Checkbox
      id={controlId}
      name={name}
      checked={value === true}
      onCheckedChange={(checked) => onChange(checked === true)}
      onBlur={onBlur}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={ariaDescribedBy || undefined}
      aria-label={config.ariaLabel}
      aria-description={config.ariaDescription}
      tabIndex={config.tabIndex}
    />
  )
}

export function NumberControl({
  config,
  field,
  controlId,
  invalid,
  describedBy,
  disabled,
}: FieldControlProps) {
  const { value, onChange, ...control } = field
  const ariaDescribedBy = [describedBy, config.ariaDescribedby].filter(Boolean).join(' ')
  return (
    <Input
        {...control}
        id={controlId}
        type="number"
        placeholder={config.placeholder}
        value={typeof value === 'number' ? String(value) : ''}
        onChange={(event) => {
          const next = event.target.valueAsNumber
          onChange(Number.isNaN(next) ? undefined : next)
        }}
        min={config.min}
        max={config.max}
        step={config.step}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={ariaDescribedBy || undefined}
        aria-label={config.ariaLabel}
        aria-description={config.ariaDescription}
        inputMode={config.inputmode as any}
        enterKeyHint={config.enterkeyhint as any}
        tabIndex={config.tabIndex}
        autoComplete={config.autocomplete}
      />
  )
}

export class FieldControlBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error }
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="text-sm font-normal text-destructive" role="alert" data-slot="field-error">
          {this.state.error.message || 'This field failed to render'}
        </div>
      )
    }
    return this.props.children
  }
}
