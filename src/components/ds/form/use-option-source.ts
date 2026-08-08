'use client'

import * as React from 'react'

import {
  mergeSelectedOptions,
  type OptionSourceStatus,
} from '@/lib/forms/option-source'
import type { FieldConfig, Option } from '@/lib/forms/types'

export function useOptionSource(
  config: FieldConfig,
  query: string,
  selected: Option[],
): { items: Option[]; status: OptionSourceStatus; isAsync: boolean } {
  const source = config.optionSource
  const [results, setResults] = React.useState<Option[]>([])
  const [status, setStatus] = React.useState<OptionSourceStatus>('idle')

  React.useEffect(() => {
    if (!source) return
    const controller = new AbortController()
    setStatus('loading')
    source(query, controller.signal)
      .then((next) => {
        if (controller.signal.aborted) return
        setResults(next)
        setStatus('idle')
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setResults([])
        setStatus('error')
      })
    return () => controller.abort()
  }, [source, query])

  if (!source) {
    return { items: config.options ?? [], status: 'idle', isAsync: false }
  }
  return { items: mergeSelectedOptions(results, selected), status, isAsync: true }
}
