import { Injectable } from '@nestjs/common'
import { DatabaseHealth } from '../../shared/database/database-health.js'
import { QueueHealth } from '../../shared/queue/queue-health.js'

@Injectable()
export class HealthService {
  constructor(
    private readonly database: DatabaseHealth,
    private readonly queue: QueueHealth
  ) {}

  async check() {
    await Promise.all([this.database.ping(), this.queue.ping()])
  }
}
