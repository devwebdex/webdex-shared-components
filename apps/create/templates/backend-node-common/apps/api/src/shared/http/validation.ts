import type { z } from 'zod'
import { HttpError } from './http-error.js'

/** Valida a entrada da rota; campos não declarados no schema são descartados pelo zod. */
export function parseInput<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }))
    throw new HttpError(400, 'Dados inválidos', details)
  }
  return result.data
}
