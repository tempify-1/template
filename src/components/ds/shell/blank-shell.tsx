import type { ReactNode } from 'react'

export function BlankShell({ children }: { children: ReactNode }) {
  return <div className="min-h-svh">{children}</div>
}
