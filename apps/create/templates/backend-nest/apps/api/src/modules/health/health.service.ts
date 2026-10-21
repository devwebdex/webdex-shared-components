import { Injectable } from '@nestjs/common'
import { DatabaseHealth } from '../../shared/database/database-health.js'
//#if queue=bullmq
import { QueueHealth } from '../../shared/queue/queue-health.js'
//#endif

@Injectable()
export class HealthService {
//#if queue=bullmq
  constructor(
    private readonly database: DatabaseHealth,
    private readonly queue: QueueHealth
  ) {}

  async check() {
    await Promise.all([this.database.ping(), this.queue.ping()])
  }
//#else
  constructor(private readonly database: DatabaseHealth) {}

  async check() {
    await this.database.ping()
  }
//#endif
}
