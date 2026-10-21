// Módulo auth: nonce do login SIWE.
import { AuthNonceSchema } from '#database/schema'

export default class AuthNonce extends AuthNonceSchema {
  // A chave é o próprio nonce, gerado pela aplicação.
  static selfAssignPrimaryKey = true
}
