# Criar um componente no `@devwebdex/ui`

Passo a passo do componente nascendo em código até ficar visível para o time de design. Decisão que colocou o código antes do Figma: [html-primeiro.md](html-primeiro.md).

## Por que o CSS não diverge entre o pacote e o Storybook

Vale entender isto antes, porque é o que explica metade dos passos.

**O `@devwebdex/ui` não envia CSS.** O `dist` tem só `.js` e `.d.ts`. O pacote envia *nomes de classe*; quem compila o CSS é sempre quem consome. São dois consumidores, com a mesma receita:

```css
/* apps/storybook/src/tailwind.css */        /* app gerado pelo @devwebdex/create */
@import "tailwindcss";                        @import "tailwindcss";
@import "@devwebdex/tokens/theme.css";        @import "@devwebdex/tokens/theme.css";
@source "../../../packages/ui/src";           @source "../../node_modules/@devwebdex/ui";
```

Mesma versão do Tailwind, mesmos tokens, mesmas classes. Não existe "o CSS do Storybook": existe um CSS compilado duas vezes a partir das mesmas três entradas.

A divergência, quando aparece, vem de um dos dois lugares:

- **`dist` desatualizado** — o Storybook lê `packages/*/dist` por link simbólico. Se o `dist` ficou velho, ele mostra outra coisa.
- **versão publicada** — o app consome `@devwebdex/tokens` do registry, numa versão fixada, não o workspace. Token alterado e não publicado não chega lá.

O primeiro se resolve com `pnpm build`. O segundo, com changeset.

## 1. A branch

```bash
git fetch origin
git checkout -b ui/<componente> origin/dev
```

Sai da **`dev`**, e o PR também vai para ela. A `prod` é a branch de release: o workflow de publicação dispara em push nela, então ela só recebe a `dev` quando é hora de publicar uma versão.

Se o componente depender de outro que ainda não foi mergeado, saia da branch dele em vez da `dev`.

## 2. Os tokens existem?

Antes de escrever uma linha, confira se os valores que o componente precisa já existem em `packages/tokens/src/`. Cor, espaçamento, raio, tipografia, sombra.

Se faltar algo, são três saídas, nesta ordem de preferência:

1. **Usar um token que já existe**, quando o valor novo estiver perto o bastante de um da escala.
2. **Pedir a Variable ao time de design**, que é o certo quando o valor é de verdade uma decisão visual nova.
3. **Criar um token provisório**, com `$description` dizendo que é provisório e de onde veio.

A saída que não existe é usar valor solto e seguir. Valor arbitrário (`p-[13px]`, `bg-[#fff]`) é exceção, e exceção se registra no PR.

## 3. O componente

```
packages/ui/src/components/<nome>/
  <nome>.tsx
  index.ts        # export { Nome, type NomeProps } from './<nome>.js'
```

E o export em `packages/ui/src/index.ts`.

Convenções:

- Pasta e arquivo em **kebab-case**, componente em **PascalCase**.
- Import relativo **com extensão `.js`**, mesmo em TypeScript: o pacote é ESM com `module: NodeNext`.
- Variantes com **`cva`**, classes mescladas por **`cn`**. Sempre aceite `className` e repasse o resto das props ao elemento raiz.
- **React 19**: `ref` é prop comum. Não use `forwardRef`; espalhar `...props` no elemento já repassa.
- **`'use client'` só** se o componente usar estado, efeito, contexto ou handler próprio. Repassar `onClick` não conta.
- Elemento semântico, foco visível em tudo que é interativo, `aria-label` em botão só com ícone.

Sobre estado: o que é pseudo-classe (`hover`, `active`, `focus-visible`, `disabled`) **não vira prop** — vira modificador de classe. O que é estado da aplicação (`loading`, `selected`) vira prop.

## 4. A story

```
apps/storybook/src/<nome>.stories.tsx
```

A story importa de `@devwebdex/ui`, não do arquivo interno. Assim ela exercita a superfície pública do pacote, do mesmo jeito que um projeto que o consome.

O mínimo: um `Playground` com controles e uma story por eixo de variante. Declare `argTypes` com `options` e `table.type` à mão — o docgen não extrai tipo de `VariantProps`, que é um mapped type, e a tabela de controles sai vazia sem isso.

## 5. Os comandos, e o que cada um protege

Durante o trabalho:

```bash
pnpm turbo run build --filter=@devwebdex/ui   # tokens + ui, nada além
pnpm --filter ui-storybook dev                # deixa rodando: hot reload do componente
```

O `pnpm build` da raiz também serve, mas faz mais do que o necessário aqui: ele roda o `storybook build` junto e gera o `storybook-static/`, que o servidor de desenvolvimento nem usa — o `dev` compila na hora. O site estático só importa para publicar e para o teste do passo 6.

O `dev` recarrega mudança no componente, **mas não em token**: o CSS importa o `theme.css` do `dist`. Mexeu em `packages/tokens/src/`? Rode `pnpm --filter @devwebdex/tokens build` e o Vite recarrega.

Antes de commitar:

| Comando | O que protege |
|---|---|
| `pnpm build` | compila tokens e `ui` na ordem certa. Sem isto, tudo depois olha uma saída velha |
| `pnpm check-types` | `tsc --noEmit` em todos os pacotes |
| `pnpm lint` | Biome na raiz e lint por pacote |
| `pnpm test` | inclui a conferência do CSS compilado (passo 6) |
| `pnpm changeset` | declara o bump de versão. Sem ele o release não publica nada |

## 6. As três falhas que não gritam

Esta cadeia tem três modos de falha em que o build termina com "completed successfully" e a saída sai errada. Vale conhecer, porque o sintoma é sempre "está diferente no Storybook e eu não sei por quê".

**`dist` velho depois de trocar de branch.** O `git checkout` não reconstrói. O Tailwind não acha os tokens, cai no tema padrão dele, e `p-8` vira 2rem em vez dos 64px de `spacing.8`.
→ `pnpm build` depois de todo `checkout`.

**Classe montada em tempo de execução.** O Tailwind só gera o que encontra *escrito* no código. Classe concatenada em variável não existe para ele, e some do CSS sem aviso.
→ Escreva a classe inteira e literal. Se não der, declare em `@source inline(...)` — e, de preferência, gere essa lista a partir do próprio componente, como faz o `.storybook/main.ts`.

**`pnpm --filter <pacote> build` pula o turbo.** Roda só o script daquele pacote, sem construir as dependências.
→ Use `pnpm build` ou `pnpm turbo run build --filter=<pacote>`.

O `apps/storybook/test/css.test.mjs` existe para pegar as três: ele confere que os tokens chegaram no CSS publicado e que toda classe que o `cva` produz tem regra lá. **Ao criar um componente novo, acrescente-o a esse teste** — hoje ele percorre só o Button, e o que não estiver na lista passa sem conferência.

## 7. A entrega

- Commit no formato `feat(ui): adiciona Spinner`.
- PR para a **`dev`**.
- `pnpm changeset` no mesmo PR: componente novo em `@devwebdex/ui` é **minor**.
- No PR: o que o componente faz, as decisões que fogem do padrão, e a **lista de lacunas** — valor sem token, variante adiada, acessibilidade pendente.

O time de design revisa pelo Storybook publicado, não pelo código. Se o componente só fizer sentido com um token que ainda não existe, diga isso no PR em vez de resolver com valor solto.
