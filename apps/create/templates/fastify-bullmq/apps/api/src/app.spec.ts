import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'
import type { DatabaseConnection } from './shared/database/database.js'
import type { RedisConnection } from './shared/queue/redis.js'

const ok = async () => {}
const failing = async () => {
  throw new Error('senha: segredo')
}

// O app só precisa de ping() para o /health; o resto das conexões não é usado nestes testes.
function appWith({ database = ok, redis = ok }) {
  return createApp({
    database: { ping: database, close: ok } as unknown as DatabaseConnection,
    redis: { ping: redis, close: ok } as unknown as RedisConnection,
    corsOrigins: ['http://localhost:3000'],
  })
}

describe('app', () => {
  it('GET /health responde ok quando o banco e o Redis respondem', async () => {
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

  it('GET /health responde 500 quando o Redis falha', async () => {
    const app = await appWith({ redis: failing })
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(500)
  })

  it('rota inexistente responde 404', async () => {
    const app = await appWith({})
    const response = await app.inject({ method: 'GET', url: '/nao-existe' })
    expect(response.statusCode).toBe(404)
  })
})
