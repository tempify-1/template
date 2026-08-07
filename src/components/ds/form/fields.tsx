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
    <ErrorBoundary>
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
    </ErrorBoundary>
  )
}

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  if (hasError && error) {
    return (
      <div className="text-sm font-normal text-destructive" role="alert" data-slot="field-error">
        {error.message || 'An error occurred'}
      </div>
    )
  }

  return <ErrorBoundaryClass setError={setError}>{children}</ErrorBoundaryClass>
}

class ErrorBoundaryClass extends React.Component<{ children: React.ReactNode; setError: (error: Error | null) => void }, { hasError: boolean; error: Error | null }> {
  constructor(props: { children: React.ReactNode; setError: (error: Error | null) => void }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): Partial<{ hasError: boolean; error: Error | null }> {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error): void {
    this.props.setError(error)
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="text-sm font-normal text-destructive" role="alert" data-slot="field-error">
          {this.state.error.message || 'An error occurred'}
        </div>
      )
    }

    return this.props.children
  }
}

export { ComboboxControl } from './fields/combobox'