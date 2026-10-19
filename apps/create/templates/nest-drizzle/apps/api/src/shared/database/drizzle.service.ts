import { Injectable, type OnModuleDestroy } from '@nestjs/common'
import { env } from '../config/env.js'
import { createDatabase, type Database } from './drizzle-client.js'

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  readonly db: Database
  private readonly close: () => Promise<void>

  constructor() {
    const { db, close } = createDatabase(env.databaseUrl)
    this.db = db
    this.close = close
  }

  async onModuleDestroy() {
    await this.close()
  }
}
