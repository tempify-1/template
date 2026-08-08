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
import { useWatch } from 'react-hook-form'
import { LockIcon, RefreshCwIcon } from 'lucide-react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@/components/ui/input-group'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { formatMinorUnits } from '@/lib/forms/price'
import { parseToMinorUnits } from '@/lib/forms/price'
import { slugify } from '@/lib/forms/slug'
import type { FieldConfig, FormValues } from '@/lib/forms/types'

export interface FieldControlProps {
  config: FieldConfig
  field: ControllerRenderProps<FormValues, string>
  controlId: string
  invalid: boolean
  describedBy?: string
  disabled?: boolean
  fieldPath: string
}

const HTML_INPUT_TYPES: Partial<Record<FieldConfig['type'], string>> = {
  email: 'email',
  tel: 'tel',
  password: 'password',
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
    <Select
      items={options}
      value={chosen}
      onValueChange={(next: string | null) => {
        if (next !== null) {
          onChange(next)
          return
        }
        const orphaned = stored !== '' && !options.some((option) => option.value === stored)
        if (orphaned && !config.required && !config.requiredWhen) onChange('')
      }}
    >
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

export function SwitchControl({ config, field, controlId, invalid, describedBy, disabled }: FieldControlProps) {
  const { value, onChange, ...control } = field
  return (
    <Switch
      {...control}
      id={controlId}
      checked={Boolean(value)}
      onCheckedChange={(next: boolean) => onChange(next)}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy || undefined}
      aria-label={config.ariaLabel}
      tabIndex={config.tabIndex}
    />
  )
}

export function ColorControl({ config, field, controlId, invalid, describedBy, disabled }: FieldControlProps) {
  const { value, ...control } = field
  const current = String(value ?? '')
  return (
    <div className="flex items-center gap-2">
      <Input
        {...control}
        id={controlId}
        type="color"
        value={current}
        disabled={disabled}
        className="h-8 w-14 p-1"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy || undefined}
        aria-label={config.ariaLabel}
      />
      <span className="text-sm text-muted-foreground" data-slot="color-value">
        {String(value ?? '')}
      </span>
    </div>
  )
}

export function SlugControl({ config, field, controlId, invalid, describedBy, disabled, fieldPath }: FieldControlProps) {
  const { value, onChange, onBlur } = field
  const [editing, setEditing] = React.useState(false)
  const [text, setText] = React.useState('')
  const sourcePath = config.slugFrom
    ? fieldPath.split('.').slice(0, -1).concat(config.slugFrom).join('.')
    : undefined
  const source = useWatch({ name: sourcePath ?? fieldPath })
  const derived = slugify(String(source ?? ''))
  const stored = String(value ?? '')
  const locked = stored !== '' && stored !== derived

  React.useEffect(() => {
    if (sourcePath && stored === '' && derived !== '' && !editing) {
      onChange(derived)
    }
  }, [derived, editing, onChange, sourcePath, stored])

  return (
    <InputGroup>
      <InputGroupInput
        id={controlId}
        value={editing ? text : stored}
        onFocus={() => {
          setEditing(true)
          setText(stored)
        }}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          const raw = event.target.value
          setText(raw)
          onChange(slugify(raw))
        }}
        onBlur={() => {
          setEditing(false)
          onBlur()
        }}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy || undefined}
      />
      <InputGroupAddon align="inline-end">
        {locked ? <LockIcon className="size-3.5 text-muted-foreground" aria-hidden /> : null}
        {sourcePath ? (
          <InputGroupButton
            size="icon-xs"
            variant="ghost"
            aria-label="Regenerate from source"
            onClick={() => {
              setEditing(false)
              onChange(derived)
            }}
          >
            <RefreshCwIcon />
          </InputGroupButton>
        ) : null}
      </InputGroupAddon>
    </InputGroup>
  )
}

export function PriceControl({ config, field, controlId, invalid, describedBy, disabled }: FieldControlProps) {
  const { value, onChange, onBlur } = field
  const [text, setText] = React.useState(() =>
    typeof value === 'number' ? formatMinorUnits(value) : '',
  )
  const textDiverges =
    text.trim() !== '' && parseToMinorUnits(text) === undefined
  return (
    <InputGroup>
      <InputGroupAddon>
        <span className="text-sm text-muted-foreground">{config.currency ?? '$'}</span>
      </InputGroupAddon>
      <InputGroupInput
        id={controlId}
        value={text}
        inputMode="decimal"
        placeholder={config.placeholder ?? '0.00'}
        disabled={disabled}
        aria-invalid={invalid || textDiverges || undefined}
        aria-describedby={describedBy || undefined}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          const next = event.target.value
          setText(next)
          if (next.trim() === '') {
            onChange(undefined)
            return
          }
          const parsed = parseToMinorUnits(next)
          if (parsed !== undefined) onChange(parsed)
        }}
        onBlur={() => {
          setText(typeof value === 'number' ? formatMinorUnits(value) : '')
          onBlur()
        }}
      />
    </InputGroup>
  )
}

export function RangeControl({ config, field, controlId, invalid, describedBy, disabled }: FieldControlProps) {
  const { value, onChange } = field
  const current = typeof value === 'number' ? value : (config.min ?? 0)
  return (
    <div className="flex items-center gap-3">
      <Slider
        id={controlId}
        value={[current]}
        min={config.min}
        max={config.max}
        step={config.step}
        disabled={disabled}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy || undefined}
        aria-label={config.ariaLabel ?? config.label}
        onValueChange={(next: number | readonly number[]) =>
          onChange(Array.isArray(next) ? next[0] : next)
        }
        className="max-w-64"
      />
      <span className="w-8 text-sm tabular-nums text-muted-foreground" data-slot="range-value">
        {typeof value === 'number' ? value : '—'}
      </span>
    </div>
  )
}
