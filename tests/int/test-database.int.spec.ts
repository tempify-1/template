import { describe, it, expect } from 'vitest'

import { TEST_DATABASE_SUFFIX, testDatabaseUrl } from '../helpers/test-database'

describe('test database isolation', () => {
  it('runs against a database whose name ends with the test suffix', () => {
    const url = new URL(process.env.DATABASE_URL!)

    expect(url.pathname.endsWith(TEST_DATABASE_SUFFIX)).toBe(true)
  })

  it('derives the test database from the development one without touching credentials', () => {
    expect(testDatabaseUrl('postgres://u:p@localhost:5433/template')).toBe(
      'postgres://u:p@localhost:5433/template_test',
    )
  })

  it('is idempotent, so a suffixed url is left alone', () => {
    expect(testDatabaseUrl('postgres://u:p@localhost:5433/template_test')).toBe(
      'postgres://u:p@localhost:5433/template_test',
    )
  })

  it('refuses a url with no database name rather than guessing', () => {
    expect(() => testDatabaseUrl('postgres://u:p@localhost:5433/')).toThrow(/no database name/)
  })
})
