import mongoose from 'mongoose'

/** Conexão própria (não a global do mongoose), para o app controlar abertura e fechamento. */
export function createMongoConnection(databaseUrl: string) {
  return mongoose.createConnection(databaseUrl)
}

export async function pingMongo(connection: mongoose.Connection) {
  const { db } = await connection.asPromise()
  if (!db) throw new Error('Conexão com o MongoDB sem banco selecionado')
  await db.admin().ping()
}
