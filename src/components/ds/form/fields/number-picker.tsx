'use client'

import { MinusIcon, PlusIcon, icons } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { FieldConfig, Option } from '@/lib/forms/types'

import type { FieldControlProps } from '../fields'

function counts(value: unknown): Record<string, number> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, number>)
    : {}
}

function total(record: Record<string, number>): number {
  return Object.values(record).reduce((a, b) => a + b, 0)
}

function Stepper({
  config,
  option,
  record,
  onChange,
  disabled,
}: {
  config: FieldConfig
  option: Option
  record: Record<string, number>
  onChange: (next: Record<string, number>) => void
  disabled?: boolean
}) {
  const current = record[option.value] ?? 0
  const atFieldMax = config.max !== undefined && total(record) >= config.max

  const set = (next: number) => {
    const clamped = Math.max(0, next)
    const draft = { ...record }
    if (clamped === 0) delete draft[option.value]
    else draft[option.value] = clamped
    onChange(draft)
  }

  return (
    <div className="flex items-center gap-2" data-slot="number-stepper" data-option={option.value}>
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        aria-label={`Fewer ${option.label}`}
        disabled={disabled || current === 0}
        onClick={() => set(current - 1)}
      >
        <MinusIcon />
      </Button>
      <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">
        {current}
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        aria-label={`More ${option.label}`}
        disabled={disabled || option.disabled || atFieldMax}
        onClick={() => set(current + 1)}
      >
        <PlusIcon />
      </Button>
    </div>
  )
}

export function NumberPickerCardsControl({
  config,
  field,
  invalid,
  describedBy,
  disabled,
}: FieldControlProps) {
  const record = counts(field.value)
  const options = config.options ?? []
  return (
    <div
      role="group"
      aria-label={config.ariaLabel ?? config.label}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy || undefined}
      className="grid gap-2 sm:grid-cols-2"
    >
      {options.map((option) => {
        const Icon = option.icon ? icons[option.icon as keyof typeof icons] : null
        return (
          <div
            key={option.value}
            className="flex items-center justify-between gap-3 rounded-lg border border-border p-3 text-sm"
          >
            <span className="flex flex-col">
              <span className="flex items-center gap-1.5 font-medium">
                {Icon ? <Icon className="size-4 text-muted-foreground" aria-hidden /> : null}
                {option.label}
              </span>
              {option.description ? (
                <span className="text-muted-foreground">{option.description}</span>
              ) : null}
            </span>
            <Stepper
              config={config}
              option={option}
              record={record}
              onChange={field.onChange}
              disabled={disabled}
            />
          </div>
        )
      })}
    </div>
  )
}

export function NumberPickerTableControl({
  config,
  field,
  invalid,
  describedBy,
  disabled,
}: FieldControlProps) {
  const record = counts(field.value)
  const options = config.options ?? []
  return (
    <div className="overflow-x-auto rounded-lg border border-border" aria-describedby={describedBy || undefined}>
      <Table aria-label={config.ariaLabel ?? config.label} aria-invalid={invalid || undefined}>
        <TableHeader>
          <TableRow>
            <TableHead>{config.label ?? config.name}</TableHead>
            <TableHead className="w-36 text-right">Quantity</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {options.map((option) => (
            <TableRow key={option.value}>
              <TableCell>
                <span className="font-medium">{option.label}</span>
                {option.description ? (
                  <span className="block text-muted-foreground">{option.description}</span>
                ) : null}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  <Stepper
                    config={config}
                    option={option}
                    record={record}
                    onChange={field.onChange}
                    disabled={disabled}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
