import { describe, it, expect } from 'vitest'

import { DEFAULT_SHELL, SHELLS, isShellName, shellFor } from '@/lib/shells'

describe('the Shell set', () => {
  it('offers exactly the Shells a Page can choose', () => {
    expect([...SHELLS]).toEqual(['website', 'dashboard', 'blank'])
  })

  it('defaults to website, so a Page with no Shell keeps its chrome', () => {
    expect(DEFAULT_SHELL).toBe('website')
    expect(SHELLS).toContain(DEFAULT_SHELL)
  })

  it('recognises every Shell in the set and nothing else', () => {
    for (const shell of SHELLS) expect(isShellName(shell), shell).toBe(true)
    for (const other of ['site', '', 'Dashboard', 'constructor', '__proto__', null, 7]) {
      expect(isShellName(other), String(other)).toBe(false)
    }
  })
})

describe('resolving a stored Shell to one that can be rendered', () => {
  it('returns each Shell in the set unchanged', () => {
    for (const shell of SHELLS) expect(shellFor(shell), shell).toBe(shell)
  })

  it('falls back to the default for a row that predates the field', () => {
    expect(shellFor(null)).toBe(DEFAULT_SHELL)
    expect(shellFor(undefined)).toBe(DEFAULT_SHELL)
  })

  it('falls back to the default for a Shell removed from the set, rather than rendering nothing', () => {
    for (const removed of ['sunset', '', 'Dashboard', 7, {}]) {
      expect(shellFor(removed), String(removed)).toBe(DEFAULT_SHELL)
    }
  })
})
