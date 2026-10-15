import 'dotenv/config'
import { afterAll, describe, expect, it } from 'vitest'
import { createApp } from '../src/app.js'
import { env } from '../src/shared/config/env.js'
import { connectDatabase } from '../src/shared/database/database.js'

describe('GET /health (banco real)', () => {
  const database = connectDatabase(env.databaseUrl)

  afterAll(async () => {
    await database.close()
  })

  it('responde ok com o banco no ar', async () => {
    const app = await createApp({ database, corsOrigins: env.corsOrigins })
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ status: 'ok' })
    await app.close()
  })
})
