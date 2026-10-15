import 'dotenv/config'
import { afterAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { env } from '../src/shared/config/env.js'
import { connectDatabase } from '../src/shared/database/database.js'
import { connectRedis } from '../src/shared/queue/redis.js'

describe('GET /health (banco e Redis reais)', () => {
  const database = connectDatabase(env.databaseUrl)
  const redis = connectRedis(env.redisUrl)

  afterAll(async () => {
    await Promise.all([database.close(), redis.close()])
  })

  it('responde ok com o banco e o Redis no ar', async () => {
    const app = await createApp({ database, redis, corsOrigins: env.corsOrigins })
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
    await app.close()
  })
})
