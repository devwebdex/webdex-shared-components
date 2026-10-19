import { createMongoConnection, pingMongo } from './mongoose-client.js'

export function connectDatabase(databaseUrl: string) {
  const connection = createMongoConnection(databaseUrl)
  return {
    connection,
    ping: () => pingMongo(connection),
    close: () => connection.close(),
  }
}

export type DatabaseConnection = ReturnType<typeof connectDatabase>
