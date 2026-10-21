# Limites de chamadas do MCP do Figma

Quanto o fluxo de [figma-para-componentes.md](figma-para-componentes.md) consome do MCP do Figma, e qual plano e assento tornam o fluxo viável. Serve de base para decidir a compra de assento (pendência A3 em [gerador-de-projetos.md](../gerador-de-projetos.md)).

Fontes, consultadas em 2026-10-13:

- [Rate limits and access (developers.figma.com)](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/), página oficial de limites do MCP.
- [figma/mcp-server-guide (GitHub)](https://github.com/figma/mcp-server-guide): o README ainda diz "6 tool calls per month" para Starter, View e Collab. A página oficial diz 20. **Este documento usa a página oficial**; o README parece desatualizado.

A própria Figma avisa que pode mudar os limites a qualquer momento. Revise este documento antes de decisões de compra.

## Limites oficiais

| Plano | Assento View ou Collab | Assento Dev ou Full |
|---|---|---|
| Starter | 20 chamadas/mês | 20 chamadas/mês |
| Professional (e Education) | 20 chamadas/mês | 200 chamadas/dia, 10/minuto |
| Organization | 20 chamadas/mês | 200 chamadas/dia, 15/minuto |
| Enterprise | 20 chamadas/mês | 600 chamadas/dia, 20/minuto |

- O limite por minuto vale **junto** com o diário ou mensal.
- Para View e Collab, a Figma diz que o limite real "pode ser menor, dependendo do tráfego".
- Na tabela da página oficial, a linha Dev/Full aparece deslocada uma coluna. A atribuição acima segue o texto da mesma página ("Organization: 200 tool calls per day", "Education: 200 por dia, 10 por minuto, como Professional", "Enterprise: 600 por dia").

### O que conta no limite

- **Contam**: ferramentas que **leem** dados do Figma. As usadas no nosso fluxo são `get_variable_defs`, `get_design_context`, `get_screenshot`, `get_metadata` e `download_assets`.
- **Não contam** (isentas, segundo a página oficial): `whoami`, `create_new_file`, `add_code_connect_map` e, em geral, ferramentas que escrevem no Figma.
- **Não documentado**: se `create_session` conta. Este documento assume que **conta**, por ser o cenário mais conservador.
- **Não documentado**: se o limite é por usuário. Na API REST da Figma, o limite é por usuário, por plano e por app. Se o MCP seguir a mesma regra, cada designer com assento Dev tem a própria cota. **Isso não está confirmado** para o MCP.

## Consumo estimado por tarefa

Estimativa baseada nos passos obrigatórios do guia. Não é uma medição: a Figma não expõe um contador de uso.

| Tarefa | Chamadas | Composição |
|---|---|---|
| Abrir sessão no arquivo | 1 | `create_session` (assumido como contando) |
| Importar tokens | 1 a 3 | `get_variable_defs` por frame ou página que contém Variables |
| Componente simples (botão, badge, input) | 2 | `get_design_context` + `get_screenshot` |
| Componente composto (card, tabela, formulário) | 3 a 6 | O nó grande exige `get_metadata` e um `get_design_context` por subparte |
| Ícone ou imagem | 1 por chamada de `download_assets` | Não verificado se vários ativos cabem numa chamada |
| Erro, nova tentativa, ajuste após revisão | +1 a 2 por ocorrência | Toda nova leitura conta |

## Cenários

Biblioteca inicial de referência: tokens, 20 componentes simples, 10 compostos e 20 ícones.

| Item | Chamadas estimadas |
|---|---|
| Sessão + tokens | 4 |
| 20 componentes simples × 2 | 40 |
| 10 componentes compostos × 4 | 40 |
| 20 ícones (pior caso, 1 por ícone) | 20 |
| Margem de retrabalho (~20%) | 20 |
| **Total** | **~125** |

O que isso significa em cada assento:

| Assento | Biblioteca inicial (~125) | Manutenção mensal (ex.: 5 componentes novos e 10 ajustes, ~40) |
|---|---|---|
| Starter ou View/Collab (20/mês) | ~6 meses; inviável | Não cabe num mês |
| Dev no Professional (200/dia) | Cabe em 1 dia | Cabe em 1 dia |
| Dev no Organization (200/dia) | Cabe em 1 dia | Cabe em 1 dia |
| Dev no Enterprise (600/dia) | Cabe em 1 dia, com folga | Cabe em 1 dia |

O limite por minuto (10 a 20) dificilmente é atingido. Entre duas chamadas, o agente gasta tempo gerando e validando código, então o ritmo real fica bem abaixo de 10 por minuto. Se for atingido, a chamada falha e deve ser repetida depois.

**Conclusão**: com 20 chamadas por mês, o fluxo não funciona. **Um assento Dev no plano Professional basta** para a biblioteca inicial e para a manutenção. Organization e Enterprise só fazem diferença por outros recursos do plano.

## Outro limite do plano que afeta os tokens: modos das Variables

O guia oficial da Figma documenta um limite de **modos por coleção de Variables**, também por plano: Starter 1 modo, Professional até 4, Organization e Enterprise 40 ou mais. Tema claro e escuro exige 2 modos, ou seja, plano **Professional ou superior** no arquivo do design. Isso afeta a pendência A7 (temas e modos).

## Como acompanhar o consumo

A Figma não mostra o uso acumulado. Por isso, o subagente `design-to-code` informa no relatório final quantas chamadas fez, por ferramenta. Somando esses relatórios, o time acompanha o consumo real e corrige as estimativas deste documento.
