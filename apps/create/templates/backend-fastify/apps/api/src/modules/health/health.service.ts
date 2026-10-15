import type { DatabaseHealth } from '../../shared/database/database-health.js'

export class HealthService {
  constructor(private readonly database: DatabaseHealth) {}

  async checkDatabase() {
    await this.database.ping()
  }
}
