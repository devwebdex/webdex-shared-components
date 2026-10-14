import { inject } from '@adonisjs/core'
import HealthService from '#modules/health/health_service'

@inject()
export default class HealthController {
  constructor(private readonly health: HealthService) {}

  async show() {
    await this.health.checkDatabase()
    return { status: 'ok' }
  }
}
