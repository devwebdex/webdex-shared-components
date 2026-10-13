# Do Figma para `@devwebdex/tokens` e `@devwebdex/ui`

Passo a passo seguido pelo time de design e pelo subagente `design-to-code`. O agente lê este documento antes de qualquer ação; se uma regra daqui conflitar com a saída do MCP do Figma, vale este documento.

## Visão geral

```
Figma Variables ──(get_variable_defs)──► packages/tokens/src/*.json ──(build)──► dist/theme.css (@theme do Tailwind 4)
Figma componente ──(get_design_context + get_screenshot)──► packages/ui/src/components/<nome>/ ──► usa só classes ligadas aos tokens
```

Tokens sempre vêm antes de componentes. Componente nunca contém valor visual que não seja token.

## 0. Pré-requisitos

| Item | Detalhe |
|---|---|
| Conta Figma | Assento **Dev ou Full** em plano Professional, Organization ou Enterprise. Assento View/Collab ou plano Starter tem limite de 20 chamadas por mês ao MCP e não serve. Detalhes e estimativas: [figma-mcp-limites.md](figma-mcp-limites.md) |
| Ambiente | Node ≥ 22 e pnpm 10. Na raiz do repositório: `pnpm install` |
| MCP do Figma | Conectado na ferramenta de IA usada (abaixo) |

Conectar o MCP do Figma (servidor remoto oficial `https://mcp.figma.com/mcp`, autenticação OAuth no navegador):

- **Claude Code**: `/plugin install figma@claude-plugins-official`, depois `/mcp` → `plugin:figma:figma` → autenticar. O plugin traz a skill `/figma-design-to-code`.
- **opencode**: no `opencode.json` do usuário:
  ```json
  { "$schema": "https://opencode.ai/config.json", "mcp": { "figma": { "type": "remote", "url": "https://mcp.figma.com/mcp" } } }
  ```
  O opencode inicia o OAuth sozinho na primeira chamada.
- **Codex**: `codex mcp add figma --url https://mcp.figma.com/mcp` e depois `codex mcp login figma`.

Fora do Claude Code, as instruções oficiais da Figma para design-to-code ficam no recurso MCP `skill://figma/figma-design-to-code/SKILL.md`; o agente deve lê-lo antes de chamar `get_design_context`.

Confirme a conexão com a ferramenta `whoami`: o assento precisa aparecer como `dev` ou `full`.

## 1. Preparar o arquivo no Figma (designer)

O agente só converte bem o que está bem estruturado. Antes de pedir a conversão:

1. **Variables nomeadas pelos namespaces do Tailwind.** O primeiro nível do nome vira o namespace do tema:

   | Grupo no Figma | Token | Variável CSS | Classe gerada |
   |---|---|---|---|
   | `color/primary` | `color.primary` | `--color-primary` | `bg-primary`, `text-primary`, `border-primary` |
   | `color/on-primary` | `color.on-primary` | `--color-on-primary` | `text-on-primary` |
   | `radius/md` | `radius.md` | `--radius-md` | `rounded-md` |
   | `spacing/md` | `spacing.md` | `--spacing-md` | `p-md`, `gap-md`, `m-md` |
   | `font/sans` | `font.sans` | `--font-sans` | `font-sans` |
   | `text/sm` | `text.sm` | `--text-sm` | `text-sm` (tamanho de fonte) |
   | `font-weight/bold` | `font-weight.bold` | `--font-weight-bold` | `font-bold` |
   | `shadow/md` | `shadow.md` | `--shadow-md` | `shadow-md` |

   Nomes em inglês, minúsculos, com hífen. Nada de espaços, acentos ou emojis.
2. **Cores semânticas por cima da paleta.** Paleta (`color/blue/500`) pode existir, mas componentes usam nomes de papel (`color/primary`, `color/surface`, `color/danger`) que apontam para a paleta (alias).
3. **Componentes com variantes como component properties**, com nomes em inglês (`variant`, `size`, `disabled`) e valores em minúsculo (`primary`, `sm`).
4. **Auto-layout em todo componente.** Sem posicionamento absoluto, salvo sobreposição intencional.
5. Toda propriedade visual do componente ligada a uma Variable, nunca valor solto.

## 2. Tokens

1. Abra a sessão: `create_session` com o `fileKey` do arquivo (da URL `figma.com/design/<fileKey>/...`).
2. Chame `get_variable_defs` no frame ou página que contém a biblioteca.
3. Escreva os tokens em `packages/tokens/src/` no formato DTCG, um arquivo por namespace (`color.json`, `radius.json`, `spacing.json`...), substituindo os valores provisórios de `tokens.json`:
   ```json
   {
     "color": {
       "$type": "color",
       "blue": { "500": { "$value": "#1d4ed8" } },
       "primary": { "$value": "{color.blue.500}" }
     }
   }
   ```
   - Alias do Figma vira referência `{caminho.do.token}`, nunca o valor copiado.
   - Dimensões em `px` como string (`"8px"`).
4. Rode `pnpm --filter @devwebdex/tokens build` e confira `packages/tokens/dist/theme.css`.
5. **Modos do Figma (ex.: dark)**: o build ainda gera só um modo. Exporte o modo padrão e registre os demais no PR; o suporte a temas está em aberto em [gerador-de-projetos.md](../gerador-de-projetos.md).

## 3. Componentes (um por vez)

1. `get_design_context` com `fileKey` e `nodeId` do componente (na URL, `node-id=12-34` vira `12:34`) e `get_screenshot` do mesmo nó.
2. A saída do MCP é **referência**, não código final. Adapte às regras abaixo.

### Estrutura

```
packages/ui/src/
  components/
    button/
      button.tsx      # componente
      index.ts        # export { Button, type ButtonProps } from './button.js'
  lib/cn.ts           # helper de classes (já existe)
  index.ts            # export * from './components/button/index.js'
```

- Pasta e arquivo em kebab-case; componente em PascalCase.
- Imports relativos **com extensão `.js`** (o pacote é ESM com `module: NodeNext`).

### API do componente

- Variantes do Figma viram variantes `cva` com os mesmos nomes e valores:
  ```tsx
  import { cva, type VariantProps } from 'class-variance-authority'
  import type { ComponentProps } from 'react'
  import { cn } from '../../lib/cn.js'

  const buttonVariants = cva('inline-flex items-center justify-center rounded-md font-sans', {
    variants: {
      variant: {
        primary: 'bg-primary text-on-primary',
        ghost: 'bg-transparent text-primary',
      },
      size: { md: 'p-md' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  })

  export type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants>

  export function Button({ className, variant, size, ...props }: ButtonProps) {
    return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
  }
  ```
- Sempre aceitar `className` (mesclado com `cn`) e repassar o resto das props ao elemento raiz.
- React 19: `ref` é prop comum; não usar `forwardRef`.
- `'use client'` no topo **apenas** se o componente usa estado, efeitos, contexto ou handlers próprios.

### Estilo

- Só classes do Tailwind ligadas a tokens. **Proibido**: cor em hex/rgb, valores arbitrários (`p-[13px]`, `bg-[#fff]`), `style` inline para valores visuais.
- Valor do Figma sem token correspondente: **pare**. Peça ao designer para criar a Variable, refaça a etapa 2 e só então continue. Nunca invente token nem use valor solto.
- Ícones: baixe o SVG com `download_assets` e crie o componente em `src/icons/<nome>.tsx` com `fill`/`stroke` em `currentColor`.

### Acessibilidade

- Elemento semântico: `button` para ação, `a` para navegação, `input` com `label` associado.
- Foco visível (`focus-visible:`) em todo elemento interativo.
- Botão só com ícone exige `aria-label`.
- Componentes com comportamento complexo (dialog, menu, select, popover, tooltip, tabs) **não** são escritos do zero. A biblioteca de primitivos acessíveis ainda está em aberto; até a decisão, não implemente esses componentes e registre-os no PR como pendentes.

## 4. Validação

Na raiz do repositório:

```bash
pnpm build
pnpm check-types
pnpm lint
```

Os três precisam passar. A validação visual (comparar o componente renderizado com o `get_screenshot`) depende do ambiente de preview, que ainda está em aberto; até lá, o designer valida no app que consome o pacote.

## 5. Entrega

- Branch `ui/<componente>` (ou `ui/tokens` para tokens).
- Commit no formato `feat(ui): adiciona Button` ou `feat(tokens): importa cores do Figma`.
- PR com: link do nó no Figma, screenshot do Figma, lista de tokens usados e lista de lacunas (valores sem token, modos não exportados, componentes adiados).
