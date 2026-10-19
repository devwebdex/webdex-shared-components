// mongoose é CommonJS: no ESM do Node só o export default existe em tempo de execução.
import mongoose from 'mongoose'

// Nonces do login SIWE (uso único, 5 minutos); _id é o próprio nonce.
const authNonceSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    expires_at: { type: Date, required: true },
  },
  { collection: 'auth_nonces', versionKey: false }
)

// Sessões: _id é o SHA-256 do token, que nunca é guardado.
const authSessionSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    address: { type: String, required: true },
    expires_at: { type: Date, required: true },
  },
  {
    collection: 'auth_sessions',
    versionKey: false,
    timestamps: { createdAt: 'created_at', updatedAt: false },
  }
)

// Índice TTL: o MongoDB apaga os expirados numa varredura por minuto; as consultas ainda filtram a validade.
for (const schema of [authNonceSchema, authSessionSchema]) {
  schema.index({ expires_at: 1 }, { expireAfterSeconds: 0 })
}

export function authModels(connection: mongoose.Connection) {
  return {
    AuthNonce: connection.model('AuthNonce', authNonceSchema),
    AuthSession: connection.model('AuthSession', authSessionSchema),
  }
}
