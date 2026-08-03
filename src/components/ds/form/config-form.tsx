'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo } from 'react'
import { useForm, Controller, type SubmitHandler } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
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
          const describedBy = config.description ? `${config.name}-description` : undefined

          return (
            <Field key={config.name} data-field={config.name}>
              {config.label ? <FieldLabel htmlFor={config.name}>{config.label}</FieldLabel> : null}
              <Controller
                control={form.control}
                name={config.name}
                defaultValue={getAtPath(seeded, config.name) as never}
                render={({ field }) => (
                  <Control
                    config={config}
                    field={field}
                    invalid={Boolean(message)}
                    describedBy={describedBy}
                  />
                )}
              />
              {config.description ? (
                <FieldDescription id={describedBy}>{config.description}</FieldDescription>
              ) : null}
              {message ? <FieldError>{message}</FieldError> : null}
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
