// Módulo auth: nonces do login SIWE, de uso único.
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_nonces'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('nonce', 32).primary()
      table.timestamp('expires_at').notNullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
