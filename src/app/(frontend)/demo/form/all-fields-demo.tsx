'use client'

import { useState } from 'react'

import { ConfigForm } from '@/components/ds/form/config-form'
import type { FieldConfig, FormValues } from '@/lib/forms/types'

export function AllFieldsDemo({ fields }: { fields: FieldConfig[] }) {
  const [submitted, setSubmitted] = useState<FormValues | null>(null)

  return (
    <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
      <ConfigForm
        fields={fields}
        submitLabel="Submit"
        onSubmit={(values) => {
          setSubmitted(values)
        }}
      />

      <div className="lg:sticky lg:top-8">
        <h2 className="text-sm font-medium text-foreground">Submitted values</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          What the action would receive. Strings, numbers and booleans only — no{' '}
          <code>{'{key,label}'}</code> objects, and array rows are bare.
        </p>
        <pre className="mt-4 max-h-[60vh] overflow-auto rounded-md border border-border bg-muted p-4 text-xs text-foreground">
          {submitted ? JSON.stringify(submitted, null, 2) : 'Nothing submitted yet.'}
        </pre>
      </div>
    </div>
  )
}
