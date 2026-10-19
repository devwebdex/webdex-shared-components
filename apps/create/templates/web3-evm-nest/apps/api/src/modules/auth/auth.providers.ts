import type { FactoryProvider } from '@nestjs/common'
//#if orm=mongoose
import { getConnectionToken } from '@nestjs/mongoose'
import type mongoose from 'mongoose'
//#endif
import { CHAIN_CLIENT, CHAIN_CONFIG } from '../../shared/chain/chain.module.js'
import type { ChainClient } from '../../shared/chain/chain-client.js'
import type { ChainConfig } from '../../shared/chain/chain-config.js'
//#if orm=prisma
import { PrismaService } from '../../shared/database/prisma.service.js'
//#endif
//#if orm=drizzle
import { DrizzleService } from '../../shared/database/drizzle.service.js'
//#endif
import { createAuthRepository } from './auth.repository.js'
import { type AuthService, createAuthService } from './auth.service.js'

export const AUTH_SERVICE = Symbol('AuthService')

/** Núcleo do login (auth.service.ts) com o repositório do ORM e o cliente da rede. */
export const authServiceProvider: FactoryProvider<AuthService> = {
  provide: AUTH_SERVICE,
//#if orm=prisma
  inject: [PrismaService, CHAIN_CLIENT, CHAIN_CONFIG],
  useFactory: (prisma: PrismaService, client: ChainClient, config: ChainConfig) =>
    createAuthService({ store: createAuthRepository({ prisma }), client, config }),
//#endif
//#if orm=drizzle
  inject: [DrizzleService, CHAIN_CLIENT, CHAIN_CONFIG],
  useFactory: (drizzle: DrizzleService, client: ChainClient, config: ChainConfig) =>
    createAuthService({ store: createAuthRepository(drizzle), client, config }),
//#endif
//#if orm=mongoose
  inject: [getConnectionToken(), CHAIN_CLIENT, CHAIN_CONFIG],
  useFactory: (connection: mongoose.Connection, client: ChainClient, config: ChainConfig) =>
    createAuthService({ store: createAuthRepository({ connection }), client, config }),
//#endif
}
