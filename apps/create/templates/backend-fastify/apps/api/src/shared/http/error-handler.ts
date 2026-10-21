import type { FastifyInstance } from 'fastify'
import { HttpError } from './http-error.js'

// Erro esperado (HttpError, requisição malformada) vira resposta clara; o resto vira 500 sem detalhes internos.
export function registerErrorHandlers(app: FastifyInstance) {
  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({ statusCode: 404, message: 'Not found' })
  })

  app.setErrorHandler((error: unknown, request, reply) => {
    if (error instanceof HttpError) {
      return reply.status(error.status).send({
        statusCode: error.status,
        message: error.message,
        ...(error.details === undefined ? {} : { details: error.details }),
      })
    }
    const status = (error as { statusCode?: unknown } | null)?.statusCode
    if (typeof status === 'number' && status >= 400 && status < 500) {
      return reply.status(status).send({ statusCode: status, message: 'Requisição inválida' })
    }
    request.log.error({ err: error }, 'erro inesperado')
    return reply.status(500).send({ statusCode: 500, message: 'Internal server error' })
  })
}
