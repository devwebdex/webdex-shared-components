// Módulo auth: sessão do login SIWE.
import { AuthSessionSchema } from '#database/schema'

export default class AuthSession extends AuthSessionSchema {
  // A chave é o hash do token, calculado pela aplicação.
  static selfAssignPrimaryKey = true
}
