import { inject } from '@adonisjs/core'
import type { HttpContext } from '@adonisjs/core/http'
import AuthService from '#modules/auth/auth_service'
//#if session=cookie
import {
  clearSessionCookie,
  readSessionToken,
  setSessionCookie,
} from '#modules/auth/session_transport'
//#endif
//#if session=token
import { readSessionToken } from '#modules/auth/session_transport'
//#endif
import { verifyValidator } from '#modules/auth/validators'

@inject()
export default class AuthController {
  constructor(private readonly auth: AuthService) {}

  async nonce() {
    return { nonce: await this.auth.issueNonce() }
  }

  async verify({ request, response }: HttpContext) {
    // tryValidate em vez de validateUsing: o contrato do login responde 400, e o Adonis, 422.
    const [error, body] = await verifyValidator.tryValidate(request.body())
    if (error) return response.badRequest({ message: 'Corpo inválido', errors: error.messages })

    const session = await this.auth.login(body.message, body.signature)
    if (!session) return response.unauthorized({ message: 'Login SIWE inválido' })
    //#if session=cookie
    setSessionCookie(response, session.token)
    return response.noContent()
    //#else
    return { token: session.token, expiresAt: session.expiresAt.toISO() }
    //#endif
  }

  me({ wallet }: HttpContext) {
    return { address: wallet.address }
  }

  //#if session=jwt
  // O JWT não fica no banco e não é revogável: o 204 só confirma, o frontend descarta o token e o
  // mesmo JWT vale até o exp (docs/standards/web3.md, "Transporte da sessão").
  logout({ response }: HttpContext) {
    return response.noContent()
  }
  //#else
  async logout({ request, response }: HttpContext) {
    const token = readSessionToken(request)
    if (token) await this.auth.logout(token)
    //#if session=cookie
    clearSessionCookie(response)
    //#endif
    return response.noContent()
  }
  //#endif
}
