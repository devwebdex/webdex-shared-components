import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator'
import type { Hex } from 'viem'
import { SIWE_MESSAGE_MAX_LENGTH, SIWE_SIGNATURE_MAX_LENGTH } from '../auth.service.js'

export class VerifyDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(SIWE_MESSAGE_MAX_LENGTH)
  message: string

  @IsString()
  @MaxLength(SIWE_SIGNATURE_MAX_LENGTH)
  @Matches(/^0x[\da-f]*$/i, { message: 'signature deve ser hexadecimal com 0x' })
  signature: Hex
}
