import { describe, expect, it } from 'vitest'
import { createApp } from './app.js'
import type { DatabaseConnection } from './shared/database/database.js'

// O app só precisa de ping() para o /health; o resto da conexão não é usado nestes testes.
function appWith(ping: () => Promise<void>) {
  const database = { ping, close: async () => {} } as unknown as DatabaseConnection
  return createApp({ database, corsOrigins: ['http://localhost:3000'] })
}

describe('app', () => {
  it('GET /health responde ok quando o banco responde', async () => {
    const app = await appWith(async () => {})
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
  })

  it('GET /health responde 500 sem detalhes quando o banco falha', async () => {
    const app = await appWith(async () => {
      throw new Error('senha: segredo')
    })
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({ statusCode: 500, message: 'Internal server error' })
  })

  it('rota inexistente responde 404', async () => {
    const app = await appWith(async () => {})
    const response = await app.inject({ method: 'GET', url: '/nao-existe' })
    expect(response.statusCode).toBe(404)
  })
})
