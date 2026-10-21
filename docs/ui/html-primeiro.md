# HTML primeiro, Figma depois

Inverte a ordem definida na D7 de [gerador-de-projetos.md](../gerador-de-projetos.md): o componente nasce em código, e o Figma passa a ser etapa de análise e correção, não a origem.

Decidido em 2026-10-19, com o time de design (Alex Gonzaga).

## O que muda

| | Antes (D7) | Agora |
|---|---|---|
| Origem do componente | arquivo do Figma | HTML e `packages/ui` |
| Papel do Figma | fonte de verdade | revisão e correção do que já existe |
| Papel do time de design | cria tokens e componentes | define a linguagem visual e valida a implementação |
| MCP do Figma | caminho crítico | opcional |

O resto da D7 continua valendo: componentes são distribuídos como `@devwebdex/ui`, tokens ficam em DTCG com os namespaces do Tailwind 4, e o componente usa `cva` com classes ligadas a token.

## Por quê

**A extração a partir do Figma não se sustentou na prática.** A A3 já apontava o limite de 20 chamadas por mês no plano Starter contra as ~125 estimadas para a biblioteca inicial. Na primeira tentativa real, o problema foi maior que o limite:

- Os plugins de Figma-para-código exportam um nó por vez e perdem o vínculo com a Variable, devolvendo hex e px soltos. O Anima limita o plano grátis a 5 exportações e a própria equipe avisa que component set grande falha.
- Foi preciso escrever [`scripts/figma-nodes.mjs`](../../scripts/figma-nodes.mjs) para puxar as 90 variantes do Button numa chamada só pela REST API. Funciona, mas é infraestrutura que existe só para contornar o limite.

**E o arquivo do Figma não era uma origem completa.** Levantamento das 90 variantes do Button:

- padding, gap, line-height, tracking e tamanho de ícone não estão ligados a Variable nenhuma — são números digitados no auto-layout;
- cinco medidas de padding estão fora da escala `Spacing`;
- o estado `Focused` é idêntico a `Enabled` nas 18 combinações, o que deixaria a navegação por teclado sem indicação visível;
- três cores não correspondem a Variable alguma.

Ou seja, mesmo com extração perfeita o componente precisaria de decisões que o Figma não respondia. Levantamento completo entregue ao time de design.

**O ganho da inversão:** a A3 deixa de bloquear. O assento Dev do Figma passa a ser útil para revisão, não requisito para produzir componente.

## Como fica o fluxo

1. O time de design define a linguagem visual. A referência aprovada é [`webdex-design-system.html`](webdex-design-system.html).
2. O componente é implementado em `packages/ui`, com tokens de `packages/tokens`.
3. O resultado é renderizado para revisão (ver A6).
4. O time de design confere no Figma e aponta correções, que voltam como mudança de código.

## Fonte de verdade

`packages/tokens` e `packages/ui` passam a ser a fonte de verdade. O `webdex-design-system.html` é **referência de linguagem visual**, não uma segunda fonte: quando os dois divergirem em um valor, vale o token.

Isso é a parte frágil da decisão. Se o HTML for editado à mão em paralelo ao código, volta o problema que a D1 queria evitar — duas cópias divergindo. Vale tratá-lo como instantâneo versionado: quando a linguagem mudar, muda o token e o HTML é refeito a partir dele.

## Três vocabulários para as mesmas coisas

Hoje o mesmo token tem três nomes:

| Conceito | Figma (Variables) | Tokens (DTCG) | `webdex-design-system.html` |
|---|---|---|---|
| cor da marca | `Cores da Marca / Marca / Brand` | `color.brand` | `--brand` |
| espaçamento | `Spacing e Radius / Spacing / Space 4` | `spacing.4` | — |
| raio pequeno | `Spacing e Radius / Radius / Radius 2` | `radius.2` | `--r-s` |
| tipografia | `Tipografia / Font Sans` | `font.sans` | `--sans` |

No fluxo novo, quem manda é a coluna do meio, porque é dela que sai o `theme.css`. Convergir os outros dois está em aberto.

## O que mudou junto

O guia e o subagente descreviam o fluxo antigo inteiro, do Figma para o componente. Os dois foram reduzidos a tokens, que é a parte que continua valendo:

- `figma-para-componentes.md` virou [`figma-para-tokens.md`](figma-para-tokens.md): como nomear Variables e escrever DTCG. A conversão de componente saiu.
- O subagente `design-to-code` virou `figma-tokens`, com escopo só de tokens. Se pedirem um componente, ele aponta [criar-componente.md](criar-componente.md) e para.

## Arquivos em `docs/ui/`

| Arquivo | O que é |
|---|---|
| `webdex-design-system.html` | referência de linguagem visual aprovada pelo design |
| `estudio-de-posts.html` | aplicação React empacotada, produto separado |
| `bidi-stickers-avatar.html` | aplicação React empacotada, produto separado |

Os dois últimos são produtos, não material de design system, e somam 960 KB de bundle. Ficam aqui por decisão do operador; bundle minificado não produz diff, então cada versão nova entra no histórico como blob inteiro.

## Em aberto

- Convergir os três vocabulários de token para os namespaces do Tailwind 4.
- Variante `Pixel` do Button: o design quer botões pixelados, de estética de jogo dos anos 90. Já existe a Variable `Font Pixel` (Pixelify Sans) e o `--pixel` no HTML, e o eixo `variant` do Button vai precisar de um quarto valor.
- Quem mantém o `webdex-design-system.html` quando a linguagem mudar.
