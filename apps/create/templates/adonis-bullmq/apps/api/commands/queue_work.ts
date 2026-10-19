import { BaseCommand } from '@adonisjs/core/ace'
import type { CommandOptions } from '@adonisjs/core/types/ace'

export default class QueueWork extends BaseCommand {
  static commandName = 'queue:work'
  static description = 'Processa as filas do BullMQ, num processo separado da API'
  static options: CommandOptions = { startApp: true, staysAlive: true }

  // Imports dentro do run: o Ace carrega este arquivo em todo comando, e só este precisa do BullMQ.
  async run() {
    const { Worker } = await import('bullmq')
    const { default: env } = await import('#start/env')
    const { MAIL_QUEUE } = await import('#modules/mail/mail_job')
    const { processSendMail } = await import('#modules/mail/mail_processor')

    const connection = { url: env.get('REDIS_URL') }
    const workers = [new Worker(MAIL_QUEUE, processSendMail, { connection })]
    this.app.terminating(async () => {
      await Promise.all(workers.map((worker) => worker.close()))
    })
    this.logger.info(`Worker processando: ${workers.map((worker) => worker.name).join(', ')}`)
  }
}
