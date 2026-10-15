import { type Hex, isHex } from 'viem'
import { z } from 'zod'

export const verifySchema = z.object({
  message: z.string().min(1),
  signature: z.custom<Hex>((value) => isHex(value, { strict: true }), 'Assinatura inválida'),
})
