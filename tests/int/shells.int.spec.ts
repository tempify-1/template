import { describe, it, expect } from 'vitest'

import { DEFAULT_SHELL, SHELLS, isShellName } from '@/lib/shells'

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

describe('the renderer fallback', () => {
  it('treats a Shell removed from the set as the default rather than rendering nothing', () => {
    for (const removed of ['sunset', undefined, null]) {
      expect(isShellName(removed)).toBe(false)
    }
  })
})
