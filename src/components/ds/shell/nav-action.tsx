'use client'

import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import type { IconName } from '@/lib/icons'
import { runAction, type ActionName } from '@/lib/nav/actions'

import { NavIcon } from './nav-icon'

export function NavAction({
  label,
  action,
  icon,
  className,
}: {
  label: string
  action: ActionName
  icon?: IconName
  className?: string
}) {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={className}
      data-action={action}
      onClick={() => runAction(action, { theme: { resolved: resolvedTheme, set: setTheme } })}
    >
      <NavIcon name={icon} className="size-4" />
      {label}
    </Button>
  )
}
