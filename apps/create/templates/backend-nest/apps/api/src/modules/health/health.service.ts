import { Injectable } from '@nestjs/common'
import { DatabaseHealth } from '../../shared/database/database-health.js'

@Injectable()
export class HealthService {
  constructor(private readonly database: DatabaseHealth) {}

  async check() {
    await this.database.ping()
  }
}
