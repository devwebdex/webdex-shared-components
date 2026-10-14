import 'dotenv/config'
import request from 'supertest'
import { afterAll, describe, it } from 'vitest'
import { createApp } from '../src/app.js'
import { env } from '../src/shared/config/env.js'
import { connectDatabase } from '../src/shared/database/database.js'

describe('GET /health (banco real)', () => {
  const database = connectDatabase(env.databaseUrl)
  const app = createApp({ database, corsOrigins: env.corsOrigins })

  afterAll(async () => {
    await database.close()
  })

  it('responde ok com o banco no ar', async () => {
    await request(app).get('/health').expect(200, { status: 'ok' })
  })
})
