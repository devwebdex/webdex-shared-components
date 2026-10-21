import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// Testes das páginas e componentes React (inertia/); os do servidor rodam no Japa.
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '~/': `${import.meta.dirname}/inertia/` } },
  test: {
    environment: 'jsdom',
    include: ['inertia/**/*.test.{ts,tsx}'],
  },
})
