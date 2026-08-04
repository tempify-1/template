import { createElement } from 'react'

import { iconFor, type IconName } from '@/lib/icons'

export function NavIcon({ name, className }: { name?: IconName; className?: string }) {
  const icon = iconFor(name)
  if (!icon) return null

  return createElement(icon, { className, 'aria-hidden': true })
}
