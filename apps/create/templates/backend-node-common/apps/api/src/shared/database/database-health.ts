/** Contrato mínimo que o módulo health espera da conexão com o banco. */
export type DatabaseHealth = {
  ping(): Promise<void>
}
