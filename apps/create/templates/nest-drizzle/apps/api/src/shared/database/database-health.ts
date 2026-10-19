import { Injectable } from '@nestjs/common'
import { sql } from 'drizzle-orm'
import { DrizzleService } from './drizzle.service.js'

@Injectable()
export class DatabaseHealth {
  constructor(private readonly drizzle: DrizzleService) {}

  async ping() {
    await this.drizzle.db.execute(sql`select 1`)
  }
}
