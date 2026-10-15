import { type Hex, isHex } from 'viem'
import { z } from 'zod'
import { SIWE_MESSAGE_MAX_LENGTH, SIWE_SIGNATURE_MAX_LENGTH } from './auth.service.js'

export const verifySchema = z.object({
  message: z.string().min(1).max(SIWE_MESSAGE_MAX_LENGTH),
  signature: z.custom<Hex>(
    (value) =>
      typeof value === 'string' &&
      value.length <= SIWE_SIGNATURE_MAX_LENGTH &&
      isHex(value, { strict: true }),
    'Assinatura inválida'
  ),
})
