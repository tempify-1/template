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

export async function ensureTestDatabase(): Promise<string> {
  const url = new URL(applyTestDatabaseUrl())
  const name = url.pathname.replace(/^\//, '')

  const { Client } = await import('pg')
  const admin = new Client({
    host: url.hostname,
    port: Number(url.port || 5432),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: 'postgres',
  })

  await admin.connect()
  try {
    const { rows } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [name])
    if (rows.length === 0) await admin.query(`CREATE DATABASE "${name}"`)
  } finally {
    await admin.end()
  }

  return url.toString()
}
