import 'dotenv/config'
import request from 'supertest'
import { afterAll, describe, it } from 'vitest'
import { createApp } from '../src/app.js'
import { env } from '../src/shared/config/env.js'
import { connectDatabase } from '../src/shared/database/database.js'
import { connectRedis } from '../src/shared/queue/redis.js'

describe('GET /health (banco e Redis reais)', () => {
  const database = connectDatabase(env.databaseUrl)
  const redis = connectRedis(env.redisUrl)
  const app = createApp({ database, redis, corsOrigins: env.corsOrigins })

  afterAll(async () => {
    await Promise.all([database.close(), redis.close()])
  })

  it('responde ok com o banco e o Redis no ar', async () => {
    await request(app).get('/health').expect(200, { status: 'ok' })
  })
})
