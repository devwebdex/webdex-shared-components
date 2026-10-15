import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
    // Testes unitários não acessam banco nem Redis; o env.ts só exige que as variáveis existam.
    env: {
      DATABASE_URL: 'unit-tests-nao-acessam-o-banco',
      REDIS_URL: 'unit-tests-nao-acessam-o-redis',
      CORS_ORIGINS: 'http://localhost',
    },
  },
})
