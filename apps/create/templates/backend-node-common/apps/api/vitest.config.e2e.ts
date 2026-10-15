import { defineConfig } from 'vitest/config'

// Testes e2e usam o banco real do .env (docker compose up -d antes de rodar).
export default defineConfig({
  test: {
    include: ['test/**/*.e2e-spec.ts'],
    fileParallelism: false,
  },
})
