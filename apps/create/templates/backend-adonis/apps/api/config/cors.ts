import { defineConfig } from '@adonisjs/cors'
import env from '#start/env'

// Só as origens listadas em CORS_ORIGINS (separadas por vírgula), em qualquer ambiente.
const corsConfig = defineConfig({
  enabled: true,
  origin: env.get('CORS_ORIGINS').split(','),
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE'],
  headers: true,
  exposeHeaders: [],
  credentials: true,
  maxAge: 90,
})

export default corsConfig
