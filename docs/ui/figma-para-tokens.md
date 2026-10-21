# Do Figma para `@devwebdex/tokens`

Como as Variables do Figma viram tokens em `packages/tokens`.

Este documento cobre **só tokens**. O componente nasce em código e o Figma entra como revisão: ver [html-primeiro.md](html-primeiro.md) para a decisão e [criar-componente.md](criar-componente.md) para o passo a passo.

```
Figma Variables ──► packages/tokens/src/*.json ──(build)──► dist/theme.css (@theme do Tailwind 4)
```

## 1. Preparar o arquivo no Figma (designer)

A importação é mecânica quando as Variables seguem estas regras, e vira tradução manual quando não seguem.

**Variables nomeadas pelos namespaces do Tailwind.** O primeiro nível do nome vira o namespace do tema:

| Grupo no Figma | Token | Variável CSS | Classe gerada |
|---|---|---|---|
| `color/brand` | `color.brand` | `--color-brand` | `bg-brand`, `text-brand`, `border-brand` |
| `color/on-brand` | `color.on-brand` | `--color-on-brand` | `text-on-brand` |
| `radius/2` | `radius.2` | `--radius-2` | `rounded-2` |
| `spacing/4` | `spacing.4` | `--spacing-4` | `p-4`, `gap-4`, `size-4` |
| `font/sans` | `font.sans` | `--font-sans` | `font-sans` |
| `text/sm` | `text.sm` | `--text-sm` | `text-sm` (tamanho de fonte) |
| `font-weight/bold` | `font-weight.bold` | `--font-weight-bold` | `font-bold` |
| `shadow/elevation-2` | `shadow.elevation-2` | `--shadow-elevation-2` | `shadow-elevation-2` |

Nomes em inglês, minúsculos, com hífen. Nada de espaços, acentos ou emojis.

**Cores semânticas por cima da paleta.** A paleta (`color/magenta/50`) pode existir, mas o componente usa nome de papel (`color/brand`, `color/surface`, `color/danger`) que aponta para ela por alias.

**Toda propriedade visual ligada a uma Variable**, nunca valor solto — inclusive padding, gap, raio e tipografia. O que não estiver ligado não tem como virar token, e o componente acaba com valor arbitrário.

> Hoje as coleções do arquivo WEbdEX — Design System estão em português, com acento, espaço e maiúscula (`Cores Semânticas`, `Space 1`, `Brand Deep`), então cada importação precisa de tradução manual. Renomear Variable no Figma **não quebra os bindings**. Convergir isso está em aberto em [html-primeiro.md](html-primeiro.md).

## 2. Ler as Variables

Dois caminhos, nenhum obrigatório.

**Pelo MCP do Figma** — `create_session` com o `fileKey` (da URL `figma.com/design/<fileKey>/...`), depois `get_variable_defs` no frame que contém a biblioteca. Exige assento Dev ou Full em plano pago; ver [figma-mcp-limites.md](figma-mcp-limites.md).

**Pela REST API** — `scripts/figma-nodes.mjs` puxa um nó e resume cada valor, marcando o que não corresponde a token:

```bash
FIGMA_TOKEN=figd_... node scripts/figma-nodes.mjs <file-key> <node-id>
node scripts/figma-nodes.mjs --from .figma-cache/<arquivo>.json   # reanálise, sem gastar cota
```

Ele não lê a definição das Variables — lê os **valores aplicados** nos nós e os cruza com `packages/tokens/src`. Serve para descobrir o que falta tokenizar, não para listar a biblioteca.

O teto de chamadas é o mesmo nos dois caminhos e segue o plano do arquivo, não o seu assento. O script salva a resposta para a reanálise sair de graça.

**Na mão** também vale, e para uma coleção pequena costuma ser mais rápido que configurar o MCP.

## 3. Escrever os tokens

Em `packages/tokens/src/`, formato DTCG, **um arquivo por namespace** (`color.json`, `spacing.json`, `radius.json`, ...):

```json
{
  "color": {
    "$type": "color",
    "magenta": { "50": { "$value": "#ff3d98" } },
    "brand": { "$value": "{color.magenta.50}" }
  }
}
```

- Alias do Figma vira **referência** `{caminho.do.token}`, nunca o valor copiado. O build emite `var(--color-magenta-50)`, e a relação sobrevive no CSS.
- Dimensões em `px` como string (`"8px"`); tamanho de fonte em `rem`, que acompanha a preferência de tamanho do navegador.
- Opacidade vira hex de 8 dígitos (`#ff6ba826`); o Style Dictionary emite `rgba()`.
- Token provisório — valor que não veio de Variable — leva `$description` dizendo que é provisório e de onde saiu.

Um limite do DTCG: um nó **não pode ser token e grupo ao mesmo tempo**. Se existir `color/coral` e a escala `color/coral/50`, um dos dois precisa de outro nome.

```bash
pnpm --filter @devwebdex/tokens build
```

Confira `packages/tokens/dist/theme.css`. O Tailwind só emite as variáveis que alguma classe usa, então um token novo só aparece no CSS depois que um componente o referencia.

## 4. Entrega

- Branch `ui/tokens`, PR para a **`dev`**.
- `pnpm changeset` no mesmo PR: mudança em `@devwebdex/tokens` que remove ou renomeia token é **minor** (antes da 1.0, quebra vai no minor).
- No PR: de onde vieram os valores, o que ficou provisório e os modos do Figma que não foram exportados.

**Modos (tema claro, por exemplo)**: o build gera só um. Exporte o modo padrão e registre os demais no PR; o suporte a temas é a pendência A7 em [gerador-de-projetos.md](../gerador-de-projetos.md).
