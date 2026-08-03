export const TEST_DATABASE_SUFFIX = '_test'

export function testDatabaseUrl(from = process.env.DATABASE_URL): string {
  if (!from) {
    throw new Error('DATABASE_URL must be set before the test database URL can be derived from it')
  }

  const url = new URL(from)
  const name = url.pathname.replace(/^\//, '').replace(/\/$/, '')

  if (!name) {
    throw new Error(`DATABASE_URL has no database name to derive a test database from: ${from}`)
  }

  if (name.endsWith(TEST_DATABASE_SUFFIX)) return url.toString()

  url.pathname = `/${name}${TEST_DATABASE_SUFFIX}`
  return url.toString()
}

export function applyTestDatabaseUrl(): string {
  const url = testDatabaseUrl()
  process.env.DATABASE_URL = url
  return url
}
