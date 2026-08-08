import type { Option } from './types'

export type OptionSource = (query: string, signal: AbortSignal) => Promise<Option[]>

export type OptionSourceStatus = 'idle' | 'loading' | 'error'

export function mergeSelectedOptions(results: Option[], selected: Option[]): Option[] {
  const offered = new Set(results.map((option) => option.value))
  return [...results, ...selected.filter((option) => !offered.has(option.value))]
}
