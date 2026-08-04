export const NAV_ACTIONS = ['toggleTheme'] as const

export type ActionName = (typeof NAV_ACTIONS)[number]

export interface ActionContext {
  theme: {
    resolved: string | undefined
    set: (theme: string) => void
  }
}

export const actionRegistry: Record<ActionName, (context: ActionContext) => void> = {
  toggleTheme: ({ theme }) => {
    theme.set(theme.resolved === 'dark' ? 'light' : 'dark')
  },
}

export function isActionName(value: string): value is ActionName {
  return NAV_ACTIONS.includes(value as ActionName)
}

export function runAction(name: ActionName, context: ActionContext): void {
  actionRegistry[name](context)
}
