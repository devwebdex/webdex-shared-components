import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'
//#if web3=evm
import type { AccessService } from './modules/access/index.js'
import type { AuthService } from './modules/auth/index.js'
//#endif
import type { DatabaseConnection } from './shared/database/database.js'
//#if queue=bullmq
import type { RedisConnection } from './shared/queue/redis.js'
//#endif

const ok = async () => {}
const failing = async () => {
  throw new Error('senha: segredo')
}

// O app só precisa de ping() para o /health; o resto das dependências não é usado nestes testes.
//#if queue=bullmq
function appWith({ database = ok, redis = ok }) {
//#else
function appWith({ database = ok }) {
//#endif
  return createApp({
    database: { ping: database, close: ok } as unknown as DatabaseConnection,
//#if queue=bullmq
    redis: { ping: redis, close: ok } as unknown as RedisConnection,
//#endif
    corsOrigins: ['http://localhost:3000'],
//#if web3=evm
    authService: {} as AuthService,
    accessService: {} as AccessService,
//#if session=cookie
    siweOrigin: 'http://localhost:3000',
//#endif
//#endif
  })
}

describe('app', () => {
//#if queue=bullmq
  it('GET /health responde ok quando o banco e o Redis respondem', async () => {
//#else
  it('GET /health responde ok quando o banco responde', async () => {
//#endif
    const app = await appWith({})
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })

  it('GET /health responde 500 sem detalhes quando o banco falha', async () => {
    const app = await appWith({ database: failing })
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({ statusCode: 500, message: 'Internal server error' })
  })
//#if queue=bullmq

  it('GET /health responde 500 quando o Redis falha', async () => {
    const app = await appWith({ redis: failing })
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(500)
  })
//#endif

  it('rota inexistente responde 404', async () => {
    const app = await appWith({})
    const response = await app.inject({ method: 'GET', url: '/nao-existe' })
    expect(response.statusCode).toBe(404)
  })
})
