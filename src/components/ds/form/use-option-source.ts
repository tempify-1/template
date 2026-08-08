'use client'

import * as React from 'react'

import {
  mergeSelectedOptions,
  type OptionSourceStatus,
} from '@/lib/forms/option-source'
import type { FieldConfig, Option } from '@/lib/forms/types'

interface SourceState {
  query: string | null
  results: Option[]
  failed: boolean
}

export function useOptionSource(
  config: FieldConfig,
  query: string,
  selected: Option[],
  enabled: boolean,
): { items: Option[]; status: OptionSourceStatus; isAsync: boolean } {
  const source = config.optionSource
  const [state, setState] = React.useState<SourceState>({
    query: null,
    results: [],
    failed: false,
  })

  React.useEffect(() => {
    if (!source || !enabled) return
    const controller = new AbortController()
    source(query, controller.signal)
      .then((results) => {
        if (controller.signal.aborted) return
        setState({ query, results, failed: false })
      })
      .catch(() => {
        if (controller.signal.aborted) return
        setState({ query, results: [], failed: true })
      })
    return () => controller.abort()
  }, [source, query, enabled])

  if (!source) {
    return { items: config.options ?? [], status: 'idle', isAsync: false }
  }

  if (!enabled) {
    return { items: mergeSelectedOptions([], selected), status: 'idle', isAsync: true }
  }

  const status: OptionSourceStatus =
    state.query !== query ? 'loading' : state.failed ? 'error' : 'idle'
  return { items: mergeSelectedOptions(state.results, selected), status, isAsync: true }
}
