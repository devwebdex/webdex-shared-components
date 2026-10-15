import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AccessService from '#modules/access/access_service'

@inject()
export default class AccessController {
  constructor(private readonly access: AccessService) {}

  // Exemplo de acesso por contrato: copie o padrão para os papéis do projeto.
  async admin({ wallet, response }: HttpContext) {
    if (!(await this.access.isAdmin(wallet.address))) {
      return response.forbidden({ message: 'Sem o papel de admin no contrato' })
    }
    return { address: wallet.address, role: 'admin' }
  }
}
