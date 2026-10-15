import vine from '@vinejs/vine'
import type { Hex } from 'viem'

export const verifyValidator = vine.create({
  message: vine.string(),
  signature: vine
    .string()
    .regex(/^0x([0-9a-fA-F]{2})+$/)
    .transform((value) => value as Hex),
})
