import 'dotenv/config'
import { createApp } from './app.js'
import { env } from './shared/config/env.js'
import { connectDatabase } from './shared/database/database.js'
import { connectRedis } from './shared/queue/redis.js'

const database = connectDatabase(env.databaseUrl)
const redis = connectRedis(env.redisUrl)
const app = await createApp(
  { database, redis, corsOrigins: env.corsOrigins },
  { logger: { level: env.logLevel } }
)
app.addHook('onClose', async () => {
  await Promise.all([database.close(), redis.close()])
})
await app.listen({ port: env.port, host: '0.0.0.0' })

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    void app.close()
  })
}
