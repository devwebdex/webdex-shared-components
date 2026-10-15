import app from '@adonisjs/core/services/app'
import db from '@adonisjs/lucid/services/db'
import { Redis } from 'ioredis'
import env from '#start/env'

// Conexão só para o ping, aberta no primeiro uso; as filas abrem as próprias pelo BullMQ.
const redis = new Redis(env.get('REDIS_URL'), { lazyConnect: true })
app.terminating(() => redis.disconnect())

export default class HealthService {
  async check() {
    await Promise.all([db.rawQuery('select 1'), redis.ping()])
  }
}
