import { Global, Module } from '@nestjs/common'
import { MongooseModule } from '@nestjs/mongoose'
import { env } from '../config/env.js'
import { DatabaseHealth } from './database-health.js'

@Global()
@Module({
  imports: [MongooseModule.forRoot(env.databaseUrl)],
  providers: [DatabaseHealth],
  exports: [DatabaseHealth],
})
export class DatabaseModule {}
