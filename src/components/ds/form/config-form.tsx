'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDownIcon, ArrowUpIcon, GripVerticalIcon, XIcon } from 'lucide-react'
import { useEffect, useId, useMemo, useState } from 'react'
import {
  Controller,
  useFieldArray,
  useForm,
  useWatch,
  type SubmitHandler,
  type UseFormReturn,
} from 'react-hook-form'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from '@/components/ui/field'
import {
  Combobox,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxStatus,
  useComboboxAnchor,
} from '@/components/ui/combobox'
import { useSectionTheme } from '@/components/ds/section/section-theme-context'
import { conditionHolds, isVisible, isEnabled, isRequired } from '@/lib/forms/conditions'
import { getAtPath } from '@/lib/forms/paths'
import { resolveRowOptions } from '@/lib/forms/options-from'
import { emptyValues } from '@/lib/forms/resolvers'
import { buildSchema } from '@/lib/forms/schema-builder'
import { hiddenValues, submittedValues } from '@/lib/forms/submitted-values'
import {
  inputFields,
  renderFields,
  type FieldConfig,
  type FormValues,
  type Option,
  type PickerOption,
} from '@/lib/forms/types'

import { fieldRegistry } from './field-registry'
import { FieldControlBoundary } from './fields'
import { RowEditorDialog } from './row-editor-dialog'
import { Wizard } from './wizard'
import { useOptionSource } from './use-option-source'

export interface ConfigFormProps {
  fields: FieldConfig[]
  defaultValues?: FormValues
  onSubmit: (values: FormValues) => void | Promise<void>
  submitLabel?: string
  onBeforeNext?: (stepIndex: number, values: FormValues) => Promise<boolean>
  initialStep?: number
  initialCompletedSteps?: number[]
  stepSubmitMode?: boolean
}

type ConfigFormApi = UseFormReturn<FormValues, unknown, FormValues>

function errorMessageAt(errors: unknown, name: string): string | undefined {
  const entry = getAtPath(errors, name)
  if (entry && typeof entry === 'object' && 'message' in entry) {
    const message = (entry as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return undefined
}

function joinPath(basePath: string, name: string): string {
  return basePath ? `${basePath}.${name}` : name
}

function mergeDeep(target: FormValues, source: FormValues): FormValues {
  const result: FormValues = { ...target }
  for (const [key, value] of Object.entries(source)) {
    const existing = result[key]
    if (
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      existing !== null &&
      typeof existing === 'object' &&
      !Array.isArray(existing)
    ) {
      result[key] = mergeDeep(existing as FormValues, value as FormValues)
    } else {
      result[key] = value
    }
  }
  return result
}

function rowIndexUnderPointer(fullName: string, x: number, y: number): number | null {
  const el = document.elementFromPoint(x, y)
  const row = el?.closest('[data-row-index]')
  if (!row) return null
  const owner = row.closest('[data-field]')
  if (!owner || owner.getAttribute('data-field') !== fullName) return null
  const parsed = Number(row.getAttribute('data-row-index'))
  return Number.isNaN(parsed) ? null : parsed
}

function DragGrip({
  fullName,
  index,
  onDrop,
}: {
  fullName: string
  index: number
  onDrop: (from: number, to: number) => void
}) {
  return (
    <span
      data-slot="row-drag-grip"
      className="flex cursor-grab touch-none items-center text-muted-foreground"
      onPointerDown={(down) => {
        down.preventDefault()
        const grip = down.currentTarget
        const pointerId = down.pointerId
        grip.setPointerCapture(pointerId)
        let target: number | null = null
        const teardown = () => {
          grip.removeEventListener('pointermove', handleMove)
          grip.removeEventListener('pointerup', handleUp)
          grip.removeEventListener('pointercancel', handleCancel)
          grip.removeEventListener('lostpointercapture', handleCancel)
        }
        const handleMove = (ev: PointerEvent) => {
          if (ev.pointerId !== pointerId) return
          target = rowIndexUnderPointer(fullName, ev.clientX, ev.clientY)
        }
        const handleUp = (ev: PointerEvent) => {
          if (ev.pointerId !== pointerId) return
          teardown()
          if (target !== null && target !== index) onDrop(index, target)
        }
        const handleCancel = (ev: PointerEvent) => {
          if (ev.pointerId !== pointerId) return
          teardown()
        }
        grip.addEventListener('pointermove', handleMove)
        grip.addEventListener('pointerup', handleUp)
        grip.addEventListener('pointercancel', handleCancel)
        grip.addEventListener('lostpointercapture', handleCancel)
      }}
    >
      <GripVerticalIcon aria-hidden className="size-3.5" />
    </span>
  )
}

function PickerDialog({
  picker,
  label,
  uid,
  fullName,
  slotsLeft,
  onAdd,
}: {
  picker: NonNullable<FieldConfig['picker']>
  label: string
  uid: string
  fullName: string
  slotsLeft: number
  onAdd: (data: FormValues[]) => void
}) {
  const pickerLabel = picker.label ?? label
  const offerable = picker.options.filter((option) => !option.disabled)
  const pickerDisabled = offerable.length === 0 || slotsLeft <= 0
  const maxSelectable = Math.min(offerable.length, slotsLeft)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) setSelected([])
  }

  const toggleOption = (value: string) => {
    setSelected((current) =>
      current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value].slice(0, maxSelectable),
    )
  }

  const addSelected = () => {
    onAdd(
      selected
        .map((value) => picker.options.find((o) => o.value === value))
        .filter((option): option is NonNullable<typeof option> => Boolean(option))
        .map((option) => option.data ?? {}),
    )
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pickerDisabled}
            aria-disabled={pickerDisabled || undefined}
          >
            {`Add from ${pickerLabel}`}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{`Add from ${pickerLabel}`}</DialogTitle>
          <DialogDescription>Select the items you want to add.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {picker.options.map((option) => {
            const isSelected = selected.includes(option.value)
            const selectable = !option.disabled && (isSelected || selected.length < maxSelectable)
            const optionId = `${uid}${fullName}-picker-${option.value}`
            return (
              <label
                key={option.value}
                htmlFor={optionId}
                className={`flex items-center gap-3 rounded-md border p-3 text-sm ${selectable || isSelected ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
              >
                <Checkbox
                  id={optionId}
                  checked={isSelected}
                  disabled={!selectable && !isSelected}
                  onCheckedChange={() => selectable && toggleOption(option.value)}
                />
                {option.label}
              </label>
            )
          })}
        </div>

        <DialogFooter>
          <DialogClose
            render={
              <Button type="button" variant="outline">
                Cancel
              </Button>
            }
          />
          <Button
            type="button"
            disabled={selected.length === 0 || selected.length > slotsLeft}
            onClick={addSelected}
          >
            {`Add ${selected.length} selected`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FieldArrayControl({
  config,
  form,
  seeded,
  basePath,
  uid,
}: {
  config: FieldConfig
  form: ConfigFormApi
  seeded: FormValues
  basePath: string
  uid: string
}) {
  const fullName = joinPath(basePath, config.name)
  const {
    fields: rows,
    append,
    remove,
    move,
  } = useFieldArray({
    control: form.control,
    name: fullName,
  }) as unknown as {
    fields: ({ id: string } & FormValues)[]
    append: (row: FormValues) => void
    remove: (index: number) => void
    move: (from: number, to: number) => void
  }
  const currentRows = useWatch({ control: form.control, name: fullName }) as unknown as
    FormValues[] | undefined
  const message = errorMessageAt(form.formState.errors, fullName)
  const label = config.label ?? config.name
  const atMax = config.max !== undefined && rows.length >= config.max
  const errorId = message ? `${uid}${fullName}-error` : undefined

  const rowValues = (index: number): FormValues => {
    if (currentRows && Array.isArray(currentRows) && index < currentRows.length) {
      return currentRows[index] as FormValues
    }
    return {}
  }

  const picker = config.picker
  const slotsLeft = config.max === undefined ? Infinity : (config.max ?? 0) - rows.length

  return (
    <FieldSet data-field={fullName}>
      <FieldLegend>{label}</FieldLegend>
      {config.description ? <FieldDescription>{config.description}</FieldDescription> : null}

      {rows.map((row, index) => (
        <FieldSet key={row.id} className="rounded-lg border border-border p-4" data-row-index={index}>
          <FieldLegend variant="label">{`${label} ${index + 1}`}</FieldLegend>

          <FieldList
            fields={config.fields ?? []}
            form={form}
            seeded={seeded}
            values={rowValues(index)}
            basePath={`${fullName}.${index}`}
            uid={uid}
          />

          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move ${label} ${index + 1} up`}
              disabled={index === 0}
              onClick={() => move(index, index - 1)}
            >
              <ArrowUpIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Move ${label} ${index + 1} down`}
              disabled={index === rows.length - 1}
              onClick={() => move(index, index + 1)}
            >
              <ArrowDownIcon />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${label} ${index + 1}`}
              onClick={() => remove(index)}
            >
              <XIcon />
            </Button>
          </div>
        </FieldSet>
      ))}

      {message ? <FieldError id={errorId}>{message}</FieldError> : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={atMax}
          onClick={() => append(emptyValues(config.fields ?? []))}
        >
          {`Add ${label}`}
        </Button>

        {picker ? (
          <PickerDialog
            picker={picker}
            label={label}
            uid={uid}
            fullName={fullName}
            slotsLeft={slotsLeft}
            onAdd={(data) => {
              const template = emptyValues(config.fields ?? [])
              for (const entry of data) {
                append(mergeDeep(template, entry))
              }
            }}
          />
        ) : null}
      </div>
    </FieldSet>
  )
}

function resolveRowFieldLabel(
  config: FieldConfig,
  row: FormValues,
  name: string,
  raw: string,
): string {
  if (!raw) return ''
  const rowField = (config.fields ?? []).find((f) => f.name === name)
  if (!rowField) return raw
  const offered = resolveRowOptions(rowField, row)
  return offered.find((o) => o.value === raw)?.label ?? raw
}

function rowSummaryTitle(
  config: FieldConfig,
  row: FormValues,
  index: number,
  source?: string | string[],
): string {
  const title = source ?? config.cardDisplay?.title
  if (title) {
    const keys = Array.isArray(title) ? title : [title]
    const parts = keys
      .map((key) => resolveRowFieldLabel(config, row, key, rowDisplayValue(row, key)))
      .filter(Boolean)
    if (parts.length) return parts.join(' - ')
  }
  return `${config.singularLabel ?? config.label ?? config.name} ${index + 1}`
}

function rowSummaryChips(config: FieldConfig, row: FormValues): string[] {
  return (config.cardDisplay?.chips ?? [])
    .map((chip) => resolveRowFieldLabel(config, row, chip.field, rowDisplayValue(row, chip.field)))
    .filter(Boolean)
}

function rowSummaryDescriptions(config: FieldConfig, row: FormValues): string[] {
  return (config.cardDisplay?.description ?? [])
    .map((entry) => {
      if (typeof entry === 'string') return entry
      if (entry.showWhen && !conditionHolds(entry.showWhen, row)) return ''
      if (entry.field)
        return resolveRowFieldLabel(config, row, entry.field, rowDisplayValue(row, entry.field))
      return entry.text ?? ''
    })
    .filter(Boolean)
}

function avatarInitials(config: FieldConfig, row: FormValues): string {
  const from = config.cardDisplay?.avatar?.from ?? []
  const initials = from
    .map((key) =>
      resolveRowFieldLabel(config, row, key, rowDisplayValue(row, key)).charAt(0).toUpperCase(),
    )
    .filter(Boolean)
    .join('')
  return initials || (config.cardDisplay?.avatar?.fallbackPrefix ?? '')
}

function isBlankRowValue(field: FieldConfig, value: unknown): boolean {
  if (field.type === 'checkbox') return value !== true
  if (field.type === 'number') return value === undefined || value === null
  return String(value ?? '').trim() === ''
}

function incompleteRowFields(fields: FieldConfig[], row: FormValues): string[] {
  const names: string[] = []
  for (const field of inputFields(fields)) {
    if (!isVisible(field, row) || !isEnabled(field, row)) continue
    const value = getAtPath(row, field.name)
    if (field.type === 'fieldArray' || field.type === 'combobox' || field.type === 'cardArray') {
      const count = Array.isArray(value) ? value.length : 0
      const minCount = field.min ?? (field.required ? 1 : 0)
      if (count < minCount) names.push(field.label ?? field.name)
      continue
    }
    if (isRequired(field, row) && isBlankRowValue(field, value)) {
      names.push(field.label ?? field.name)
    }
  }
  return names
}

function rowDisplayValue(row: FormValues, key: string): string {
  const value = getAtPath(row, key)
  if (value === undefined || value === null) return ''
  return String(value)
}

function ComboboxArrayControl({
  config,
  form,
  seeded,
  basePath,
  uid,
  disabled = false,
}: {
  config: FieldConfig
  form: ConfigFormApi
  seeded: FormValues
  basePath: string
  uid: string
  disabled?: boolean
}) {
  const fullName = joinPath(basePath, config.name)
  const theme = useSectionTheme()
  const anchorRef = useComboboxAnchor()
  const [inputValue, setInputValue] = useState('')
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const [engaged, setEngaged] = useState(false)
  const {
    fields: rows,
    append,
    remove,
    move,
  } = useFieldArray({
    control: form.control,
    name: fullName,
  }) as unknown as {
    fields: ({ id: string } & FormValues)[]
    append: (row: FormValues) => void
    remove: (index: number) => void
    move: (from: number, to: number) => void
  }
  const currentRows = (useWatch({ control: form.control, name: fullName }) ?? []) as FormValues[]

  const label = config.label ?? config.name
  const selectedAsOptions: Option[] = currentRows
    .map((row) => ({
      value: rowDisplayValue(row, 'value'),
      label: rowDisplayValue(row, 'label'),
    }))
    .filter((option) => option.value !== '')
  const singular = config.singularLabel
  const addPlaceholder =
    config.placeholder ?? `Type to add ${singular ? `${singular}s` : label.toLowerCase()}`
  const { items, status, isAsync } = useOptionSource(config, inputValue, selectedAsOptions, engaged)
  const options = items
  const reselect = config.reselectOptions === true
  const addable = config.cardDisplay?.addable !== false && !disabled
  const removable = config.cardDisplay?.removable !== false && !disabled
  const editable = config.editableOptions !== false && !disabled
  const reorderable = config.draggable === true && !disabled
  const showCompletion = config.cardDisplay?.showCompletionStatus === true
  const atMax = config.max !== undefined && rows.length >= config.max
  const message = errorMessageAt(form.formState.errors, fullName)
  const rowErrorIndexes = rows
    .map((_, index) => index)
    .filter((index) => getAtPath(form.formState.errors, `${fullName}.${index}`) !== undefined)
  const rowErrorMessage =
    activeIndex === null && rowErrorIndexes.length > 0
      ? `Complete ${singular ?? label.toLowerCase()} ${rowErrorIndexes.map((i) => i + 1).join(', ')}`
      : undefined
  const id = `${uid}${fullName}`
  const descriptionId = config.description ? `${id}-description` : undefined
  const errorId = message || rowErrorMessage ? `${id}-error` : undefined
  const describedBy =
    [descriptionId, errorId, config.ariaDescribedby].filter(Boolean).join(' ') || undefined

  const rowValues = (index: number): FormValues => currentRows[index] ?? {}
  const selectedValues = new Set(currentRows.map((row) => rowDisplayValue(row, 'value')))
  const comboboxValue = reselect
    ? []
    : options.filter((option) => selectedValues.has(option.value))

  const addRow = (option: Option) => {
    if (atMax) return
    const template = emptyValues(config.fields ?? [])
    const seededRow = mergeDeep(template, { value: option.value, label: option.label })
    append(mergeDeep(seededRow, (option as PickerOption).data ?? {}))
  }

  const handleValueChange = (next: Option[]) => {
    setInputValue('')
    if (reselect) {
      const picked = next[next.length - 1]
      if (picked) addRow(picked)
      return
    }
    const nextValues = new Set(next.map((option) => option.value))
    for (const option of next) {
      if (!selectedValues.has(option.value)) addRow(option)
    }
    if (removable) {
      const offered = new Set(options.map((option) => option.value))
      const goneIndex = currentRows.findIndex((row) => {
        const rowValue = rowDisplayValue(row, 'value')
        return offered.has(rowValue) && !nextValues.has(rowValue)
      })
      if (goneIndex >= 0) {
        remove(goneIndex)
        if (activeIndex === goneIndex) setActiveIndex(null)
      }
    }
  }

  const itemDisabled = (option: Option): boolean => {
    if (option.disabled) return true
    if (!atMax) return false
    if (reselect) return true
    return !selectedValues.has(option.value)
  }

  const modalTitle = (index: number): string =>
    rowSummaryTitle(config, rowValues(index), index, config.cardDisplay?.modalTitle)
  const modalChips = (index: number): string[] => rowSummaryChips(config, rowValues(index))
  const modalDescriptions = (index: number): string[] =>
    rowSummaryDescriptions(config, rowValues(index))

  return (
    <Field
      data-field={fullName}
      onKeyDown={(event) => {
        const target = event.target as HTMLElement
        if (event.key === 'Enter' && target.dataset.slot === 'combobox-chip-input') {
          event.preventDefault()
        }
      }}
    >
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      {config.description ? (
        <FieldDescription id={descriptionId}>{config.description}</FieldDescription>
      ) : null}

      <Combobox
        multiple
        autoHighlight
        items={options}
        value={comboboxValue}
        onValueChange={handleValueChange}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        filter={isAsync ? null : undefined}
        isItemEqualToValue={(a: Option, b: Option) => a.value === b.value}
      >
        <ComboboxChips ref={anchorRef} aria-label={config.ariaLabel ?? `${label} items`}>
          {rows.map((row, index) => {
            const values = rowValues(index)
            const chipLabel = rowDisplayValue(values, 'label') || `${singular ?? label} ${index + 1}`
            const incomplete = showCompletion
              ? incompleteRowFields(config.fields ?? [], values)
              : []
            return (
              <span
                key={row.id}
                data-slot="combobox-chip"
                data-row-index={index}
                className="flex h-[calc(--spacing(5.25))] w-fit items-center justify-center gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-foreground has-data-[slot=combobox-chip-remove]:pr-0"
              >
                {reorderable ? (
                  <DragGrip
                    fullName={fullName}
                    index={index}
                    onDrop={(from, to) => {
                      move(from, to)
                      setAnnouncement(`${chipLabel} moved to position ${to + 1}`)
                    }}
                  />
                ) : null}
                {editable ? (
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-label={`Edit ${chipLabel}`}
                    className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                    onClick={() => setActiveIndex(index)}
                  >
                    {chipLabel}
                  </button>
                ) : (
                  <span>{chipLabel}</span>
                )}
                {incomplete.length > 0 ? (
                  <span
                    role="status"
                    aria-label={`${incomplete.length} fields incomplete`}
                    className="size-1.5 rounded-full bg-destructive"
                  />
                ) : null}
                {removable ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    data-slot="combobox-chip-remove"
                    aria-label={`Remove ${chipLabel}`}
                    className="-ml-1 opacity-50 hover:opacity-100"
                    onClick={() => {
                      remove(index)
                      if (activeIndex === index) setActiveIndex(null)
                    }}
                  >
                    <XIcon className="pointer-events-none" />
                  </Button>
                ) : null}
              </span>
            )
          })}
          {addable ? (
            <ComboboxChipsInput
              id={id}
              placeholder={addPlaceholder}
              disabled={disabled}
              onFocus={() => setEngaged(true)}
              aria-describedby={describedBy}
              aria-description={config.ariaDescription}
              aria-label={config.ariaLabel}
              tabIndex={config.tabIndex}
              aria-invalid={message || rowErrorMessage ? true : undefined}
              onKeyDown={(event) => {
                if (
                  event.key === 'Backspace' &&
                  event.currentTarget.value === '' &&
                  rows.length > 0
                ) {
                  event.preventDefault()
                  if (removable) {
                    remove(rows.length - 1)
                    if (activeIndex === rows.length - 1) setActiveIndex(null)
                  }
                }
              }}
            />
          ) : null}
        </ComboboxChips>
        {addable ? (
          <ComboboxContent anchor={anchorRef} data-theme={theme ?? undefined}>
            {status === 'loading' ? <ComboboxStatus>Loading…</ComboboxStatus> : null}
            {status === 'error' ? (
              <ComboboxStatus>Couldn&apos;t load results</ComboboxStatus>
            ) : null}
            {status === 'idle' ? <ComboboxEmpty>No results.</ComboboxEmpty> : null}
            <ComboboxList>
              {(option: Option) => (
                <ComboboxItem key={option.value} value={option} disabled={itemDisabled(option)}>
                  {option.label}
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        ) : null}
      </Combobox>

      {message || rowErrorMessage ? (
        <FieldError id={errorId}>{message ?? rowErrorMessage}</FieldError>
      ) : null}

      <span aria-live="polite" className="sr-only" data-slot="reorder-announcement">
        {announcement}
      </span>

      {activeIndex !== null && rows[activeIndex] ? (
        <RowEditorDialog
          open
          onOpenChange={(next) => {
            if (!next) setActiveIndex(null)
          }}
          title={modalTitle(activeIndex)}
          position={{ index: activeIndex, total: rows.length }}
          chips={modalChips(activeIndex)}
          descriptions={modalDescriptions(activeIndex)}
          incomplete={incompleteRowFields(config.fields ?? [], rowValues(activeIndex))}
          onPrev={activeIndex > 0 ? () => setActiveIndex(activeIndex - 1) : undefined}
          onNext={activeIndex < rows.length - 1 ? () => setActiveIndex(activeIndex + 1) : undefined}
          onMoveUp={
            reorderable && activeIndex > 0
              ? () => {
                  move(activeIndex, activeIndex - 1)
                  setActiveIndex(activeIndex - 1)
                }
              : undefined
          }
          onMoveDown={
            reorderable && activeIndex < rows.length - 1
              ? () => {
                  move(activeIndex, activeIndex + 1)
                  setActiveIndex(activeIndex + 1)
                }
              : undefined
          }
        >
          <FieldList
            fields={config.fields ?? []}
            form={form}
            seeded={seeded}
            values={rowValues(activeIndex)}
            basePath={`${fullName}.${activeIndex}`}
            uid={uid}
          />
        </RowEditorDialog>
      ) : null}
    </Field>
  )
}

function CardArrayControl({
  config,
  form,
  seeded,
  basePath,
  uid,
  disabled = false,
}: {
  config: FieldConfig
  form: ConfigFormApi
  seeded: FormValues
  basePath: string
  uid: string
  disabled?: boolean
}) {
  const fullName = joinPath(basePath, config.name)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const {
    fields: rows,
    append,
    remove,
    move,
  } = useFieldArray({
    control: form.control,
    name: fullName,
  }) as unknown as {
    fields: ({ id: string } & FormValues)[]
    append: (row: FormValues) => void
    remove: (index: number) => void
    move: (from: number, to: number) => void
  }
  const currentRows = (useWatch({ control: form.control, name: fullName }) ?? []) as FormValues[]

  const label = config.label ?? config.name
  const singular = config.singularLabel ?? label
  const addable = config.cardDisplay?.addable !== false && !disabled
  const removable = config.cardDisplay?.removable !== false && !disabled
  const showCompletion = config.cardDisplay?.showCompletionStatus === true
  const hideHeader = config.cardDisplay?.hideHeader === true
  const reorderable = config.draggable === true && !disabled
  const atMax = config.max !== undefined && rows.length >= config.max
  const message = errorMessageAt(form.formState.errors, fullName)
  const rowErrorIndexes = rows
    .map((_, index) => index)
    .filter((index) => getAtPath(form.formState.errors, `${fullName}.${index}`) !== undefined)
  const rowErrorMessage =
    activeIndex === null && rowErrorIndexes.length > 0
      ? `Complete ${singular.toLowerCase()} ${rowErrorIndexes.map((i) => i + 1).join(', ')}`
      : undefined
  const id = `${uid}${fullName}`
  const errorId = message || rowErrorMessage ? `${id}-error` : undefined

  const rowValues = (index: number): FormValues => currentRows[index] ?? {}

  const picker = config.picker
  const slotsLeft = config.max === undefined ? Infinity : (config.max ?? 0) - rows.length

  return (
    <FieldSet data-field={fullName}>
      <FieldLegend>{label}</FieldLegend>
      {config.description ? <FieldDescription>{config.description}</FieldDescription> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {rows.map((row, index) => {
          const values = rowValues(index)
          const incomplete = showCompletion
            ? incompleteRowFields(config.fields ?? [], values)
            : []
          const chips = rowSummaryChips(config, values)
          const initials = avatarInitials(config, values)
          return (
            <div key={row.id} className="relative" data-row-index={index}>
              <button
                type="button"
                aria-haspopup="dialog"
                aria-label={`Edit ${rowSummaryTitle(config, values, index)}`}
                className="w-full rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                onClick={() => setActiveIndex(index)}
              >
                <Card className="gap-2 py-4">
                  {!hideHeader ? (
                    <CardHeader className="px-4">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        {initials ? (
                          <span className="flex size-6 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            {initials}
                          </span>
                        ) : null}
                        {rowSummaryTitle(config, values, index)}
                        {incomplete.length > 0 ? (
                          <span
                            role="status"
                            aria-label={`${incomplete.length} fields incomplete`}
                            className="size-1.5 rounded-full bg-destructive"
                          />
                        ) : null}
                      </CardTitle>
                      {chips.length ? (
                        <CardDescription className="flex flex-wrap gap-1">
                          {chips.map((chip, chipIndex) => (
                            <span
                              key={`${chipIndex}-${chip}`}
                              className="rounded-sm bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
                            >
                              {chip}
                            </span>
                          ))}
                        </CardDescription>
                      ) : null}
                    </CardHeader>
                  ) : null}
                  <CardContent className="px-4 text-sm text-muted-foreground">
                    {rowSummaryDescriptions(config, values).map((line, lineIndex) => (
                      <p key={`${lineIndex}-${line}`}>{line}</p>
                    ))}
                  </CardContent>
                </Card>
              </button>
              {removable ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${rowSummaryTitle(config, values, index)}`}
                  className="absolute top-2 right-2"
                  onClick={() => {
                    remove(index)
                    if (activeIndex === index) setActiveIndex(null)
                  }}
                >
                  <XIcon />
                </Button>
              ) : null}
              {reorderable ? (
                <span className="absolute bottom-2 right-2">
                  <DragGrip
                    fullName={fullName}
                    index={index}
                    onDrop={(from, to) => {
                      move(from, to)
                      setAnnouncement(
                        `${rowSummaryTitle(config, values, index)} moved to position ${to + 1}`,
                      )
                    }}
                  />
                </span>
              ) : null}
            </div>
          )
        })}
      </div>

      {message || rowErrorMessage ? (
        <FieldError id={errorId}>{message ?? rowErrorMessage}</FieldError>
      ) : null}

      <span aria-live="polite" className="sr-only" data-slot="reorder-announcement">
        {announcement}
      </span>

      {addable ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={atMax}
            onClick={() => append(emptyValues(config.fields ?? []))}
          >
            {`Add ${singular}`}
          </Button>
          {picker ? (
            <PickerDialog
              picker={picker}
              label={label}
              uid={uid}
              fullName={fullName}
              slotsLeft={slotsLeft}
              onAdd={(data: FormValues[]) => {
                for (const entry of data) {
                  append(mergeDeep(emptyValues(config.fields ?? []), entry))
                }
              }}
            />
          ) : null}
        </div>
      ) : null}

      {activeIndex !== null && rows[activeIndex] ? (
        <RowEditorDialog
          open
          onOpenChange={(next) => {
            if (!next) setActiveIndex(null)
          }}
          title={rowSummaryTitle(config, rowValues(activeIndex), activeIndex, config.cardDisplay?.modalTitle)}
          position={{ index: activeIndex, total: rows.length }}
          chips={rowSummaryChips(config, rowValues(activeIndex))}
          descriptions={rowSummaryDescriptions(config, rowValues(activeIndex))}
          incomplete={incompleteRowFields(config.fields ?? [], rowValues(activeIndex))}
          onPrev={activeIndex > 0 ? () => setActiveIndex(activeIndex - 1) : undefined}
          onNext={activeIndex < rows.length - 1 ? () => setActiveIndex(activeIndex + 1) : undefined}
          onMoveUp={
            reorderable && activeIndex > 0
              ? () => {
                  move(activeIndex, activeIndex - 1)
                  setActiveIndex(activeIndex - 1)
                }
              : undefined
          }
          onMoveDown={
            reorderable && activeIndex < rows.length - 1
              ? () => {
                  move(activeIndex, activeIndex + 1)
                  setActiveIndex(activeIndex + 1)
                }
              : undefined
          }
        >
          <FieldList
            fields={config.fields ?? []}
            form={form}
            seeded={seeded}
            values={rowValues(activeIndex)}
            basePath={`${fullName}.${activeIndex}`}
            uid={uid}
          />
        </RowEditorDialog>
      ) : null}
    </FieldSet>
  )
}

function AccordionSection({
  config,
  form,
  seeded,
  values,
  basePath,
  uid,
}: {
  config: FieldConfig
  form: ConfigFormApi
  seeded: FormValues
  values: FormValues
  basePath: string
  uid: string
}) {
  const [open, setOpen] = useState(false)
  const [sawError, setSawError] = useState(false)
  const childNames = inputFields(config.fields ?? []).map((child) =>
    joinPath(basePath, child.name),
  )
  const hasChildError = childNames.some(
    (name) => getAtPath(form.formState.errors, name) !== undefined,
  )

  if (hasChildError !== sawError) {
    setSawError(hasChildError)
    if (hasChildError) setOpen(true)
  }

  return (
    <Accordion
      value={open ? [config.name] : []}
      onValueChange={(next: unknown[]) => setOpen(next.length > 0)}
      data-field={config.name}
    >
      <AccordionItem value={config.name}>
        <AccordionTrigger
          className={hasChildError ? 'text-destructive' : undefined}
          data-error={hasChildError || undefined}
        >
          {config.label ?? config.name}
        </AccordionTrigger>
        <AccordionContent className="flex flex-col gap-5">
          {config.description ? (
            <FieldDescription>{config.description}</FieldDescription>
          ) : null}
          <FieldList
            fields={config.fields ?? []}
            form={form}
            seeded={seeded}
            values={values}
            basePath={basePath}
            uid={uid}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

function FieldList({
  fields,
  form,
  seeded,
  values,
  basePath,
  uid,
}: {
  fields: FieldConfig[]
  form: ConfigFormApi
  seeded: FormValues
  values: FormValues
  basePath: string
  uid: string
}) {
  return (
    <>
      {renderFields(fields).map((config) => {
        if (!isVisible(config, values)) return null

        if (config.type === 'accordion') {
          return (
            <AccordionSection
              key={config.name}
              config={config}
              form={form}
              seeded={seeded}
              values={values}
              basePath={basePath}
              uid={uid}
            />
          )
        }

        if (config.type === 'fieldset') {
          return (
            <FieldSet key={config.name} data-field={config.name}>
              <FieldLegend>{config.label ?? config.name}</FieldLegend>
              {config.description ? (
                <FieldDescription>{config.description}</FieldDescription>
              ) : null}
              <FieldList
                fields={config.fields ?? []}
                form={form}
                seeded={seeded}
                values={values}
                basePath={basePath}
                uid={uid}
              />
            </FieldSet>
          )
        }

        if (config.type === 'fieldArray') {
          return (
            <FieldArrayControl
              key={config.name}
              config={config}
              form={form}
              seeded={seeded}
              basePath={basePath}
              uid={uid}
            />
          )
        }

        if (config.type === 'cardArray') {
          return (
            <CardArrayControl
              key={config.name}
              config={config}
              form={form}
              seeded={seeded}
              basePath={basePath}
              uid={uid}
              disabled={!isEnabled(config, values)}
            />
          )
        }

        if (config.type === 'combobox') {
          return (
            <ComboboxArrayControl
              key={config.name}
              config={config}
              form={form}
              seeded={seeded}
              basePath={basePath}
              uid={uid}
              disabled={!isEnabled(config, values)}
            />
          )
        }

        const Control = fieldRegistry[config.type as keyof typeof fieldRegistry]
        if (!Control) return null

        const resolvedConfig = config.optionsFrom
          ? { ...config, options: resolveRowOptions(config, values) }
          : config

        const fullName = joinPath(basePath, config.name)
        const message = errorMessageAt(form.formState.errors, fullName)
        const id = `${uid}${fullName}`
        const descriptionId = config.description ? `${id}-description` : undefined
        const errorId = message ? `${id}-error` : undefined
        const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined
        const disabled = !isEnabled(config, values)

        const label = config.label ? <FieldLabel htmlFor={id}>{config.label}</FieldLabel> : null
        const description = config.description ? (
          <FieldDescription id={descriptionId}>{config.description}</FieldDescription>
        ) : null
        const error = message ? <FieldError id={errorId}>{message}</FieldError> : null

        const control = (
          <Controller
            control={form.control}
            name={fullName}
            defaultValue={getAtPath(seeded, fullName) as never}
            render={({ field }) => (
              <FieldControlBoundary>
                <Control
                  config={resolvedConfig}
                  field={{ ...field, disabled }}
                  controlId={id}
                  invalid={Boolean(message)}
                  describedBy={describedBy}
                  disabled={disabled || undefined}
                />
              </FieldControlBoundary>
            )}
          />
        )

        if (config.type === 'checkbox') {
          return (
            <Field key={fullName} orientation="horizontal" data-field={fullName}>
              {control}
              <FieldContent>
                {label}
                {description}
                {error}
              </FieldContent>
            </Field>
          )
        }

        return (
          <Field key={fullName} data-field={fullName}>
            {label}
            {control}
            {description}
            {error}
          </Field>
        )
      })}
    </>
  )
}

export function ConfigForm({
  fields,
  defaultValues,
  onSubmit,
  submitLabel,
  onBeforeNext,
  initialStep,
  initialCompletedSteps,
  stepSubmitMode,
}: ConfigFormProps) {
  const schema = useMemo(() => buildSchema(fields), [fields])
  const seeded = useMemo(
    () => ({ ...emptyValues(fields), ...(defaultValues ?? {}) }),
    [fields, defaultValues],
  )

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: seeded,
    mode: 'onSubmit',
    shouldUnregister: false,
  })

  const uid = useId()
  const values = form.watch() as Record<string, unknown>
  const submit = fields.find((field) => field.type === 'submit')
  const steps = fields.filter((field) => field.type === 'step')
  if (steps.length > 0) {
    const stray = fields.filter((field) => field.type !== 'step' && field.type !== 'submit')
    if (stray.length > 0) {
      throw new Error(
        `A stepped form must keep every field inside a step; stray: ${stray.map((f) => f.name).join(', ')}`,
      )
    }
  }

  useEffect(() => {
    for (const { path, empty } of hiddenValues(fields, values as FormValues)) {
      form.setValue(path, empty as never, { shouldValidate: false, shouldDirty: false })
    }
  }, [fields, form, values])

  const handle: SubmitHandler<Record<string, unknown>> = async (submitted) => {
    await onSubmit(submittedValues(fields, submitted as FormValues))
  }

  return (
    <form onSubmit={form.handleSubmit(handle)} noValidate>
      {steps.length > 0 ? (
        <Wizard
          steps={steps}
          form={form}
          submitLabel={submit?.label ?? submitLabel ?? 'Submit'}
          onBeforeNext={onBeforeNext}
          initialStep={initialStep}
          initialCompletedSteps={initialCompletedSteps}
          stepSubmitMode={stepSubmitMode}
          renderStep={(step) => (
            <FieldGroup>
              <FieldList
                fields={step.fields ?? []}
                form={form}
                seeded={seeded}
                values={values as FormValues}
                basePath=""
                uid={uid}
              />
            </FieldGroup>
          )}
        />
      ) : (
        <FieldGroup>
          <FieldList
            fields={fields}
            form={form}
            seeded={seeded}
            values={values as FormValues}
            basePath=""
            uid={uid}
          />

          <Button type="submit" disabled={form.formState.isSubmitting}>
            {submit?.label ?? submitLabel ?? 'Submit'}
          </Button>
        </FieldGroup>
      )}
    </form>
  )
}
