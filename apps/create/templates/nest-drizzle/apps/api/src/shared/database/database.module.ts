import { Global, Module } from '@nestjs/common'
import { DatabaseHealth } from './database-health.js'
import { DrizzleService } from './drizzle.service.js'

@Global()
@Module({
  providers: [DrizzleService, DatabaseHealth],
  exports: [DrizzleService, DatabaseHealth],
})
export class DatabaseModule {}
