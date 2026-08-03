import 'dotenv/config'

import { ensureTestDatabase } from './helpers/test-database'

export default async function globalSetup() {
  await ensureTestDatabase()
}
