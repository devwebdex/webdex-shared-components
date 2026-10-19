//#if queue=bullmq
import app from '@adonisjs/core/services/app'
//#endif
import db from '@adonisjs/lucid/services/db'
//#if queue=bullmq
import { Redis } from 'ioredis'
import env from '#start/env'

// Conexão só para o ping, aberta no primeiro uso; as filas abrem as próprias pelo BullMQ.
const redis = new Redis(env.get('REDIS_URL'), { lazyConnect: true })
app.terminating(() => redis.disconnect())
//#endif

export default class HealthService {
  async check() {
    //#if queue=bullmq
    await Promise.all([db.rawQuery('select 1'), redis.ping()])
    //#else
    await db.rawQuery('select 1')
    //#endif
  }
}
