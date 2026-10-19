function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Variável de ambiente obrigatória ausente: ${name}`)
  return value
}

export const env = {
  port: Number(process.env.PORT ?? 3333),
  logLevel: process.env.LOG_LEVEL ?? 'info',
  databaseUrl: required('DATABASE_URL'),
//#if queue=bullmq
  redisUrl: required('REDIS_URL'),
//#endif
  corsOrigins: required('CORS_ORIGINS').split(','),
}
