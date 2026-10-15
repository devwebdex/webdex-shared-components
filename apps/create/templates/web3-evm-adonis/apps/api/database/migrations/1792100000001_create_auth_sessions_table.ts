// Módulo auth: sessões do login SIWE. O id é o SHA-256 do token; o token não é guardado.
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_sessions'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id', 64).primary()
      table.string('address', 42).notNullable()
      table.timestamp('expires_at').notNullable()
      table.timestamp('created_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
