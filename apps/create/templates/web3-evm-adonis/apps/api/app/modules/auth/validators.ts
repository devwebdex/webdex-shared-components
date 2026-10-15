import vine from '@vinejs/vine'
import type { Hex } from 'viem'
import { MAX_MESSAGE_LENGTH, MAX_SIGNATURE_LENGTH } from '#modules/auth/auth_service'

// Os tetos vêm antes de qualquer leitura da mensagem (docs/standards/web3.md).
export const verifyValidator = vine.create({
  message: vine.string().maxLength(MAX_MESSAGE_LENGTH),
  signature: vine
    .string()
    .maxLength(MAX_SIGNATURE_LENGTH)
    .regex(/^0x([0-9a-fA-F]{2})+$/)
    .transform((value) => value as Hex),
})
