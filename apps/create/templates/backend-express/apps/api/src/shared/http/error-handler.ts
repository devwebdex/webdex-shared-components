import type { ErrorRequestHandler, RequestHandler } from 'express'
import { HttpError } from './http-error.js'

export const notFoundHandler: RequestHandler = (_req, res) => {
  res.status(404).json({ statusCode: 404, message: 'Not found' })
}

// Erro esperado (HttpError, JSON malformado) vira resposta clara; o resto vira 500 sem detalhes internos.
export const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      statusCode: error.status,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    })
    return
  }
  if (isClientError(error)) {
    res.status(error.status).json({ statusCode: error.status, message: 'Requisição inválida' })
    return
  }
  console.error(error)
  res.status(500).json({ statusCode: 500, message: 'Internal server error' })
}

function isClientError(error: unknown): error is { status: number } {
  const status = (error as { status?: unknown } | null)?.status
  return typeof status === 'number' && status >= 400 && status < 500
}
