/** Erro esperado: o handler de erros responde com o status e a mensagem dele. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown
  ) {
    super(message)
  }
}
