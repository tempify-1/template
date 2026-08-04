import { createElement } from 'react'

import { iconFor } from '@/lib/icons'

export function NavIcon({ name, className }: { name?: string; className?: string }) {
  const icon = iconFor(name)
  if (!icon) return null

  return createElement(icon, { className, 'aria-hidden': true })
}
