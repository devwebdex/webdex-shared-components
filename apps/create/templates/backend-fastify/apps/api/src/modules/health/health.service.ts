/** Dependência que o /health confere (banco, Redis...). */
export type HealthCheck = {
  ping(): Promise<void>
}

export class HealthService {
  constructor(private readonly checks: HealthCheck[]) {}

  async check() {
    await Promise.all(this.checks.map((dependency) => dependency.ping()))
  }
}
