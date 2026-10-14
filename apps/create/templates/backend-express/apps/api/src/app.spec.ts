import request from 'supertest'
import { describe, it } from 'vitest'
import { createApp } from './app.js'
import type { DatabaseConnection } from './shared/database/database.js'

// O app só precisa de ping() para o /health; o resto da conexão não é usado nestes testes.
function appWith(ping: () => Promise<void>) {
  const database = { ping, close: async () => {} } as unknown as DatabaseConnection
  return createApp({ database, corsOrigins: ['http://localhost:3000'] })
}

describe('app', () => {
  it('GET /health responde ok quando o banco responde', async () => {
    await request(appWith(async () => {}))
      .get('/health')
      .expect(200, { status: 'ok' })
  })

  it('GET /health responde 500 sem detalhes quando o banco falha', async () => {
    const failing = appWith(async () => {
      throw new Error('senha: segredo')
    })
    await request(failing).get('/health').expect(500, {
      statusCode: 500,
      message: 'Internal server error',
    })
  })

  it('rota inexistente responde 404', async () => {
    await request(appWith(async () => {}))
      .get('/nao-existe')
      .expect(404)
  })
})
