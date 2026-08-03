'use client'

import { useState } from 'react'

import { ConfigForm } from '@/components/ds/form/config-form'
import { submitForm } from '@/app/actions/submit-form'
import { formDefinitions, isFormName } from '@/lib/forms/definitions'
import type { FormValues } from '@/lib/forms/types'
import type { FormBlock as FormBlockSpec } from '@/lib/presets/types'

type Status = { state: 'idle' } | { state: 'ok'; message: string } | { state: 'error'; message: string }

export function FormBlock({ block }: { block: FormBlockSpec }) {
  const [status, setStatus] = useState<Status>({ state: 'idle' })

  if (!isFormName(block.formName)) return null
  const definition = formDefinitions[block.formName]

  async function handleSubmit(values: FormValues) {
    setStatus({ state: 'idle' })
    const result = await submitForm(definition.name, values)
    setStatus({ state: result.ok ? 'ok' : 'error', message: result.message })
  }

  if (status.state === 'ok') {
    return (
      <p
        role="status"
        className="w-full max-w-xl rounded-lg border border-border bg-card p-4 text-left text-sm text-foreground"
      >
        {status.message}
      </p>
    )
  }

  return (
    <div className="w-full max-w-xl text-left">
      {status.state === 'error' ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {status.message}
        </p>
      ) : null}
      <ConfigForm
        fields={definition.fields}
        onSubmit={handleSubmit}
        submitLabel={definition.submitLabel}
      />
    </div>
  )
}
