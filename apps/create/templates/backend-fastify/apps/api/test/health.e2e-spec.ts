import 'dotenv/config'
import { afterAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
//#if web3=evm
import type { AccessService } from '../src/modules/access/index.js'
import type { AuthService } from '../src/modules/auth/index.js'
//#endif
import { env } from '../src/shared/config/env.js'
import { connectDatabase } from '../src/shared/database/database.js'
//#if queue=bullmq
import { connectRedis } from '../src/shared/queue/redis.js'
//#endif

//#if queue=bullmq
describe('GET /health (banco e Redis reais)', () => {
//#else
describe('GET /health (banco real)', () => {
//#endif
  const database = connectDatabase(env.databaseUrl)
//#if queue=bullmq
  const redis = connectRedis(env.redisUrl)
//#endif

  afterAll(async () => {
//#if queue=bullmq
    await Promise.all([database.close(), redis.close()])
//#else
    await database.close()
//#endif
  })

//#if queue=bullmq
  it('responde ok com o banco e o Redis no ar', async () => {
//#else
  it('responde ok com o banco no ar', async () => {
//#endif
    const app = await createApp({
      database,
//#if queue=bullmq
      redis,
//#endif
      corsOrigins: env.corsOrigins,
//#if web3=evm
      // O /health não passa pelo login; ele tem o próprio e2e (auth.e2e-spec.ts).
      authService: {} as AuthService,
      accessService: {} as AccessService,
//#if session=cookie
      siweOrigin: 'http://localhost:3000',
//#endif
//#endif
    })
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
    await app.close()
  })
})
