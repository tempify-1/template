'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { SectionTheme } from '@/lib/presets/theme'

const SectionThemeContext = createContext<SectionTheme | undefined>(undefined)

export function SectionThemeProvider({
  theme,
  children,
}: {
  theme?: SectionTheme
  children: ReactNode
}) {
  return <SectionThemeContext.Provider value={theme}>{children}</SectionThemeContext.Provider>
}

export function useSectionTheme(): SectionTheme | undefined {
  return useContext(SectionThemeContext)
}
