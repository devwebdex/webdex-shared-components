import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.spec.ts'],
//#if queue=bullmq
    // Testes unitários não acessam banco nem Redis; o env.ts só exige que as variáveis existam.
//#else
    // Testes unitários não acessam o banco; o env.ts só exige que as variáveis existam.
//#endif
    env: {
      DATABASE_URL: 'unit-tests-nao-acessam-o-banco',
//#if queue=bullmq
      REDIS_URL: 'unit-tests-nao-acessam-o-redis',
//#endif
      CORS_ORIGINS: 'http://localhost',
    },
  },
})
