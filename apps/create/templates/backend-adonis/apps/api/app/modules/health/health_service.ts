import db from '@adonisjs/lucid/services/db'

export default class HealthService {
  async check() {
    await db.rawQuery('select 1')
  }
}
