'use client'

import { useEffect, useRef, useState } from 'react'

import { submitForm } from '@/app/actions/submit-form'
import { ConfigForm } from '@/components/ds/form/config-form'
import { formDefinitions } from '@/lib/forms/definitions'
import type { FormValues } from '@/lib/forms/types'
import type { FormBlock as FormBlockSpec } from '@/lib/presets/types'

type Status =
  { state: 'idle' } | { state: 'ok'; message: string } | { state: 'error'; message: string }

const UNREACHABLE = 'We could not reach the server. Please check your connection and try again.'

export function FormBlock({ block }: { block: FormBlockSpec }) {
  const [status, setStatus] = useState<Status>({ state: 'idle' })
  const successRef = useRef<HTMLParagraphElement>(null)
  const definition = formDefinitions[block.formName]

  useEffect(() => {
    if (status.state === 'ok') successRef.current?.focus()
  }, [status.state])

  async function handleSubmit(values: FormValues) {
    try {
      const result = await submitForm(block.formName, values)
      setStatus({ state: result.ok ? 'ok' : 'error', message: result.message })
    } catch {
      setStatus({ state: 'error', message: UNREACHABLE })
    }
  }

  return (
    <div className="w-full max-w-xl text-left">
      <div role="status" aria-live="polite">
        {status.state === 'ok' ? (
          <p
            ref={successRef}
            tabIndex={-1}
            className="rounded-lg border border-border bg-card p-4 text-sm text-foreground"
          >
            {status.message}
          </p>
        ) : null}
      </div>

      {status.state === 'error' ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {status.message}
        </p>
      ) : null}

      {status.state === 'ok' ? null : (
        <ConfigForm
          fields={definition.fields}
          onSubmit={handleSubmit}
          submitLabel={definition.submitLabel}
        />
      )}
    </div>
  )
}
