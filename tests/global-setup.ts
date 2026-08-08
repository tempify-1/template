import 'dotenv/config'

import { execSync } from 'node:child_process'

import { ensureTestDatabase } from './helpers/test-database'

export default async function globalSetup() {
  await ensureTestDatabase()
  execSync('pnpm exec tsx tests/helpers/bootstrap-schema.ts', {
    stdio: 'inherit',
    env: process.env,
  })
}
