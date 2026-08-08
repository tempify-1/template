'use client'

import { icons } from 'lucide-react'

import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { Option } from '@/lib/forms/types'

import type { FieldControlProps } from '../fields'

function OptionIcon({ name }: { name?: string }) {
  if (!name) return null
  const Icon = icons[name as keyof typeof icons]
  if (!Icon) return null
  return <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
}

function CardShell({
  option,
  control,
  htmlFor,
}: {
  option: Option
  control: React.ReactNode
  htmlFor: string
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 text-sm transition-colors hover:bg-muted has-aria-checked:border-ring has-aria-checked:bg-muted"
    >
      {control}
      <span className="flex flex-col gap-0.5">
        <span className="flex items-center gap-1.5 font-medium">
          <OptionIcon name={option.icon} />
          {option.label}
        </span>
        {option.description ? (
          <span className="text-muted-foreground">{option.description}</span>
        ) : null}
      </span>
    </label>
  )
}

export function RadioCardsControl({
  config,
  field,
  controlId,
  invalid,
  describedBy,
  disabled,
}: FieldControlProps) {
  const options = config.options ?? []
  const stored = String(field.value ?? '')
  return (
    <RadioGroup
      value={options.some((o) => o.value === stored) ? stored : null}
      onValueChange={(next: unknown) => {
        if (next !== null) field.onChange(String(next))
      }}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy || undefined}
      aria-label={config.ariaLabel ?? config.label}
      className="grid gap-2 sm:grid-cols-2"
    >
      {options.map((option) => (
        <CardShell
          key={option.value}
          option={option}
          htmlFor={`${controlId}-${option.value}`}
          control={
            <RadioGroupItem
              id={`${controlId}-${option.value}`}
              value={option.value}
              disabled={option.disabled}
              className="mt-0.5"
            />
          }
        />
      ))}
    </RadioGroup>
  )
}

export function RadioTabsControl({
  config,
  field,
  controlId,
  invalid,
  describedBy,
  disabled,
}: FieldControlProps) {
  const options = config.options ?? []
  const stored = String(field.value ?? '')
  return (
    <ToggleGroup
      value={stored ? [stored] : []}
      onValueChange={(next: unknown[]) => {
        field.onChange(String(next[next.length - 1] ?? ''))
      }}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy || undefined}
      aria-label={config.ariaLabel ?? config.label}
      id={controlId}
      className="w-fit"
    >
      {options.map((option) => (
        <ToggleGroupItem key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

export function CheckboxCardsControl({
  config,
  field,
  controlId,
  invalid,
  describedBy,
  disabled,
}: FieldControlProps) {
  const options = config.options ?? []
  const stored = Array.isArray(field.value) ? (field.value as string[]) : []
  const atMax = config.max !== undefined && stored.length >= config.max

  const toggle = (value: string) => {
    if (stored.includes(value)) {
      field.onChange(stored.filter((entry) => entry !== value))
    } else if (!atMax) {
      field.onChange([...stored, value])
    }
  }

  return (
    <div
      role="group"
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy || undefined}
      aria-label={config.ariaLabel ?? config.label}
      className="grid gap-2 sm:grid-cols-2"
    >
      {options.map((option) => (
        <CardShell
          key={option.value}
          option={option}
          htmlFor={`${controlId}-${option.value}`}
          control={
            <Checkbox
              id={`${controlId}-${option.value}`}
              checked={stored.includes(option.value)}
              disabled={
                disabled || option.disabled || (atMax && !stored.includes(option.value))
              }
              onCheckedChange={() => toggle(option.value)}
              className="mt-0.5"
            />
          }
        />
      ))}
    </div>
  )
}
