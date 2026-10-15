import 'dotenv/config'
import { createApp } from './app.js'
import { env } from './shared/config/env.js'
import { connectDatabase } from './shared/database/database.js'

const database = connectDatabase(env.databaseUrl)
const app = await createApp(
  { database, corsOrigins: env.corsOrigins },
  { logger: { level: env.logLevel } }
)
app.addHook('onClose', () => database.close())
await app.listen({ port: env.port, host: '0.0.0.0' })

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    void app.close()
  })
}
