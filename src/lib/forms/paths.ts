export function pathSegments(path: string): string[] {
  return path.split('.').filter((segment) => segment.length > 0)
}

export function getAtPath(source: unknown, path: string): unknown {
  let current = source

  for (const segment of pathSegments(path)) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[segment]
  }

  return current
}

export function setAtPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const segments = pathSegments(path)
  if (segments.length === 0) return

  let current = target

  for (const segment of segments.slice(0, -1)) {
    const next = current[segment]
    if (next === null || typeof next !== 'object') {
      current[segment] = {}
    }
    current = current[segment] as Record<string, unknown>
  }

  current[segments[segments.length - 1]!] = value
}
