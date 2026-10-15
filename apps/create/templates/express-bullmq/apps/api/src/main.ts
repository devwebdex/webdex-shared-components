import 'dotenv/config'
import { createApp } from './app.js'
import { env } from './shared/config/env.js'
import { connectDatabase } from './shared/database/database.js'
import { connectRedis } from './shared/queue/redis.js'

const database = connectDatabase(env.databaseUrl)
const redis = connectRedis(env.redisUrl)
const app = createApp({ database, redis, corsOrigins: env.corsOrigins })
const server = app.listen(env.port, (error) => {
  if (error) throw error
  console.log(`API em http://localhost:${env.port}`)
})

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.once(signal, () => {
    server.close(() => {
      void Promise.all([database.close(), redis.close()])
    })
  })
}
