# Monólito modular

Uma aplicação, um deploy, um banco; dividida em módulos com fronteiras rígidas, como se fossem serviços. O objetivo é manter o custo baixo de um monólito sem deixar o código virar um emaranhado, e permitir extrair um módulo para serviço próprio no futuro sem reescrevê-lo.

## O que é um módulo

- Um módulo é uma **capacidade de negócio** (`billing`, `users`, `orders`), nunca uma camada técnica (`controllers`, `repositories`, `utils`).
- Fica em `src/modules/<modulo>/` e contém tudo o que a capacidade precisa: rotas, regras, acesso a dados, DTOs.
- `src/shared/` contém só infraestrutura sem regra de negócio (configuração, conexão com banco, utilitários técnicos).

## Fronteiras

1. **Outro módulo só usa o que o módulo exporta.** No Nest, isso é o array `exports` do módulo. Importar arquivo interno de outro módulo (`../orders/orders.repository.js`) é proibido.
2. **Cada tabela tem um dono.** Só o módulo dono lê ou escreve nas tabelas dele. Para obter dados de outro módulo, chame o serviço exportado por ele, nunca a tabela direto.
3. **Sem dependência circular.** Se A depende de B e B precisa reagir a algo de A, use evento (B escuta o evento publicado por A). `forwardRef` é sinal de fronteira errada.
4. **Sem chave estrangeira entre tabelas de módulos diferentes**, salvo decisão registrada. Referencie pelo ID e valide via serviço do módulo dono.
5. **Transação não atravessa módulos.** Se uma operação precisa de consistência entre dois módulos, a fronteira provavelmente está errada; discuta antes de implementar.

## Comunicação entre módulos

| Necessidade | Como |
|---|---|
| Consultar dado de outro módulo | Injetar o serviço exportado por ele |
| Reagir a algo que aconteceu em outro módulo | Evento de domínio publicado pelo módulo de origem |
| Compartilhar tipo | Tipo exportado pelo módulo dono, nunca a entidade do ORM |

## Sinais de que a fronteira está errada

- Dois módulos sempre mudam juntos no mesmo PR.
- Um módulo precisa de muitos dados internos de outro.
- Aparece um módulo `common` ou `core` crescendo com regras de negócio.

Nesses casos, junte os módulos ou redesenhe a fronteira antes de seguir.
