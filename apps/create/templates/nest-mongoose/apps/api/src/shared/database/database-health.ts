import { Injectable } from '@nestjs/common'
import { InjectConnection } from '@nestjs/mongoose'
// mongoose é CommonJS: no ESM do Node só o export default existe em tempo de execução.
import mongoose from 'mongoose'
import { pingMongo } from './mongoose-client.js'

@Injectable()
export class DatabaseHealth {
  constructor(@InjectConnection() private readonly connection: mongoose.Connection) {}

  async ping() {
    await pingMongo(this.connection)
  }
}
