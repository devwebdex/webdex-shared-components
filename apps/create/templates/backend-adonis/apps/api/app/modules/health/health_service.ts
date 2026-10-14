import db from '@adonisjs/lucid/services/db'

export default class HealthService {
  async checkDatabase() {
    await db.rawQuery('select 1')
  }
}
