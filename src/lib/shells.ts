export const SHELLS = ['website', 'dashboard', 'blank'] as const

export type ShellName = (typeof SHELLS)[number]

export const DEFAULT_SHELL: ShellName = 'website'

export function isShellName(value: unknown): value is ShellName {
  return typeof value === 'string' && SHELLS.includes(value as ShellName)
}
