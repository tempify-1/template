import {
  Activity,
  BarChart3,
  Check,
  Clock,
  Gauge,
  Globe,
  Layers,
  Lock,
  Plug,
  Rocket,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react'

export const ICONS = {
  activity: Activity,
  chart: BarChart3,
  check: Check,
  clock: Clock,
  gauge: Gauge,
  globe: Globe,
  layers: Layers,
  lock: Lock,
  plug: Plug,
  rocket: Rocket,
  search: Search,
  shield: ShieldCheck,
  sparkles: Sparkles,
  users: Users,
  workflow: Workflow,
  zap: Zap,
} as const satisfies Record<string, LucideIcon>

export const ICON_NAMES = Object.keys(ICONS) as [IconName, ...IconName[]]

export type IconName = keyof typeof ICONS

export function isIconName(value: string): value is IconName {
  return Object.hasOwn(ICONS, value)
}

export function iconFor(name: string | undefined): LucideIcon | undefined {
  if (!name || !isIconName(name)) return undefined
  return ICONS[name]
}
