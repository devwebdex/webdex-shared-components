import { Injectable } from '@nestjs/common'
import { PrismaService } from '../../shared/database/prisma.service.js'

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async checkDatabase() {
    await this.prisma.$queryRaw`SELECT 1`
  }
}
