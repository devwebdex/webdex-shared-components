import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma.service.js'

@Injectable()
export class DatabaseHealth {
  constructor(private readonly prisma: PrismaService) {}

  async ping() {
    await this.prisma.$queryRaw`SELECT 1`
  }
}
