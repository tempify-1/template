export function parseToMinorUnits(display: string): number | undefined {
  const cleaned = display.replace(/[^0-9.]/g, '')
  if (cleaned === '' || cleaned.split('.').length > 2) return undefined
  const [whole, fraction = ''] = cleaned.split('.')
  if (fraction.length > 2) return undefined
  if (whole === '' && fraction === '') return undefined
  const minor = Number(whole || '0') * 100 + Number(fraction.padEnd(2, '0') || '0')
  return Number.isSafeInteger(minor) ? minor : undefined
}

export function formatMinorUnits(minor: number): string {
  const sign = minor < 0 ? '-' : ''
  const abs = Math.abs(minor)
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}
