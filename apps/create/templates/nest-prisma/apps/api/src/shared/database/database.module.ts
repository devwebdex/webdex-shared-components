import { Global, Module } from '@nestjs/common'
import { DatabaseHealth } from './database-health.js'
import { PrismaService } from './prisma.service.js'

@Global()
@Module({
  providers: [PrismaService, DatabaseHealth],
  exports: [PrismaService, DatabaseHealth],
})
export class DatabaseModule {}
