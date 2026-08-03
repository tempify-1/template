'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useMemo } from 'react'
import { useForm, Controller, type SubmitHandler } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { isVisible } from '@/lib/forms/conditions'
import { getAtPath } from '@/lib/forms/paths'
import { emptyValues } from '@/lib/forms/resolvers'
import { buildSchema } from '@/lib/forms/schema-builder'
import { inputFields, type FieldConfig, type FormValues } from '@/lib/forms/types'

import { fieldRegistry } from './field-registry'

export interface ConfigFormProps {
  fields: FieldConfig[]
  defaultValues?: FormValues
  onSubmit: (values: FormValues) => void | Promise<void>
  submitLabel?: string
}

function errorMessageAt(errors: unknown, name: string): string | undefined {
  const entry = getAtPath(errors, name)
  if (entry && typeof entry === 'object' && 'message' in entry) {
    const message = (entry as { message?: unknown }).message
    if (typeof message === 'string') return message
  }
  return undefined
}

export function ConfigForm({ fields, defaultValues, onSubmit, submitLabel }: ConfigFormProps) {
  const schema = useMemo(() => buildSchema(fields), [fields])
  const seeded = useMemo(
    () => ({ ...emptyValues(fields), ...(defaultValues ?? {}) }),
    [fields, defaultValues],
  )

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: seeded,
    mode: 'onSubmit',
    shouldUnregister: true,
  })

  const uid = useId()
  const controlId = (name: string) => `${uid}${name}`
  const values = form.watch()
  const submit = fields.find((field) => field.type === 'submit')

  const handle: SubmitHandler<FormValues> = async (submitted) => {
    await onSubmit(submitted)
  }

  return (
    <form onSubmit={form.handleSubmit(handle)} noValidate>
      <FieldGroup>
        {inputFields(fields).map((config) => {
          if (!isVisible(config, values)) return null

          const Control = fieldRegistry[config.type as keyof typeof fieldRegistry]
          if (!Control) return null

          const message = errorMessageAt(form.formState.errors, config.name)
          const id = controlId(config.name)
          const descriptionId = config.description ? `${id}-description` : undefined
          const errorId = message ? `${id}-error` : undefined
          const describedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

          const label = config.label ? <FieldLabel htmlFor={id}>{config.label}</FieldLabel> : null
          const description = config.description ? (
            <FieldDescription id={descriptionId}>{config.description}</FieldDescription>
          ) : null
          const error = message ? <FieldError id={errorId}>{message}</FieldError> : null

          const control = (
            <Controller
              control={form.control}
              name={config.name}
              defaultValue={getAtPath(seeded, config.name) as never}
              render={({ field }) => (
                <Control
                  config={config}
                  field={field}
                  controlId={id}
                  invalid={Boolean(message)}
                  describedBy={describedBy}
                />
              )}
            />
          )

          if (config.type === 'checkbox') {
            return (
              <Field key={config.name} orientation="horizontal" data-field={config.name}>
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
            <Field key={config.name} data-field={config.name}>
              {label}
              {control}
              {description}
              {error}
            </Field>
          )
        })}

        <Button type="submit" disabled={form.formState.isSubmitting}>
          {submit?.label ?? submitLabel ?? 'Submit'}
        </Button>
      </FieldGroup>
    </form>
  )
}
