import { IsNotEmpty, IsString, Matches } from 'class-validator'
import type { Hex } from 'viem'

export class VerifyDto {
  @IsString()
  @IsNotEmpty()
  message: string

  @Matches(/^0x[\da-f]*$/i, { message: 'signature deve ser hexadecimal com 0x' })
  signature: Hex
}
