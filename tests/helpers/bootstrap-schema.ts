import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../../src/payload.config'
import { applyTestDatabaseUrl } from './test-database'

applyTestDatabaseUrl()
const payload = await getPayload({ config })
if (typeof payload.db.destroy === 'function') {
  await payload.db.destroy()
}
process.exit(0)
