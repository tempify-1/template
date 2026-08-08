'use client'

import { CalendarIcon } from 'lucide-react'
import * as React from 'react'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useSectionTheme } from '@/components/ds/section/section-theme-context'
import { parseIsoDate, toIsoDate } from '@/lib/forms/date'
import type { FieldConfig } from '@/lib/forms/types'

import type { FieldControlProps } from '../fields'

function resolveBound(limit: FieldConfig['minDate']): Date | undefined {
  if (limit === undefined) return undefined
  return limit === 'today' ? new Date() : limit
}

function disabledMatcher(config: FieldConfig) {
  const before = resolveBound(config.minDate)
  const after = resolveBound(config.maxDate)
  if (before && after) return { before, after }
  if (before) return { before }
  if (after) return { after }
  return undefined
}

export function DateControl({
  config,
  field,
  controlId,
  invalid,
  describedBy,
  disabled,
}: FieldControlProps) {
  const theme = useSectionTheme()
  const stored = String(field.value ?? '')
  const [text, setText] = React.useState(stored)
  const [open, setOpen] = React.useState(false)
  const selected = parseIsoDate(stored)

  return (
    <div className="flex items-center gap-1">
      <Input
        id={controlId}
        value={text}
        placeholder={config.placeholder ?? 'yyyy-mm-dd'}
        disabled={disabled}
        inputMode="numeric"
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy || undefined}
        onChange={(event) => {
          const next = event.target.value
          setText(next)
          if (next === '') {
            field.onChange('')
            return
          }
          field.onChange(parseIsoDate(next) ? next : '')
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && text !== '' && !parseIsoDate(text)) {
            event.preventDefault()
          }
        }}
        onBlur={() => {
          setText(stored)
          field.onBlur()
        }}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={disabled}
              aria-label={`Open calendar for ${config.label ?? config.name}`}
            />
          }
        >
          <CalendarIcon />
        </PopoverTrigger>
        <PopoverContent data-theme={theme ?? undefined} className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selected}
            defaultMonth={selected}
            disabled={disabledMatcher(config)}
            onSelect={(next?: Date) => {
              if (next) {
                const iso = toIsoDate(next)
                field.onChange(iso)
                setText(iso)
              }
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

export function DateRangeControl({
  config,
  field,
  controlId,
  invalid,
  describedBy,
  disabled,
}: FieldControlProps) {
  const theme = useSectionTheme()
  const stored =
    field.value !== null && typeof field.value === 'object' && !Array.isArray(field.value)
      ? (field.value as { start?: string; end?: string })
      : undefined
  const selected: DateRange | undefined = stored
    ? { from: parseIsoDate(stored.start ?? ''), to: parseIsoDate(stored.end ?? '') }
    : undefined
  const label =
    stored?.start && stored?.end ? `${stored.start} → ${stored.end}` : (config.placeholder ?? 'Pick dates')

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            id={controlId}
            disabled={disabled}
            aria-invalid={invalid || undefined}
            aria-describedby={describedBy || undefined}
            className="w-fit font-normal"
          />
        }
      >
        <CalendarIcon />
        {label}
      </PopoverTrigger>
      <PopoverContent data-theme={theme ?? undefined} className="w-auto p-0">
        <Calendar
          mode="range"
          selected={selected}
          defaultMonth={selected?.from}
          disabled={disabledMatcher(config)}
          onSelect={(next?: DateRange) => {
            if (!next?.from) {
              field.onChange(undefined)
              return
            }
            const start = toIsoDate(next.from)
            const end = next.to ? toIsoDate(next.to) : start
            field.onChange(start <= end ? { start, end } : { start: end, end: start })
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
