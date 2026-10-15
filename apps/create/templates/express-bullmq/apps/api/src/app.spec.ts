import request from 'supertest'
import { describe, it } from 'vitest'
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
    await request(appWith({})).get('/health').expect(200, { status: 'ok' })
  })

  it('GET /health responde 500 sem detalhes quando o banco falha', async () => {
    await request(appWith({ database: failing }))
      .get('/health')
      .expect(500, { statusCode: 500, message: 'Internal server error' })
  })

  it('GET /health responde 500 quando o Redis falha', async () => {
    await request(appWith({ redis: failing }))
      .get('/health')
      .expect(500)
  })

  it('rota inexistente responde 404', async () => {
    await request(appWith({})).get('/nao-existe').expect(404)
  })
})
