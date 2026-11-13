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

Componente com comportamento (abrir, escolher, navegar pelo teclado) usa o primitivo do Radix (D16) e lê o estado dos atributos que ele põe no DOM: `data-state`, `data-highlighted`, `data-placeholder`. Com o `cmdk` (Combobox), o destaque é `data-selected="true"`. Para desabilitado, use `aria-disabled:`, não `data-disabled:` — o `cmdk` põe `data-disabled="false"` em todo item habilitado, e a regra pegaria todos; já `aria-disabled:` só casa com `"true"`.

## 4. A story

```
apps/storybook/src/stories/<nome>.stories.tsx
```

A story importa de `@devwebdex/ui`, não do arquivo interno. Assim ela exercita a superfície pública do pacote, do mesmo jeito que um projeto que o consome.

**O `title` é que monta a barra lateral**, e é só uma string com `/`:

```ts
title: 'Componentes/Alert'            // solto
title: 'Componentes/Campos/InputField' // dentro da pasta Campos
```

Pasta só quando houver **dois ou mais componentes da mesma família** — hoje `Campos` (InputField, TextField), `Dropdown` (Combobox, Menu, Select) e `Loading` (Spinner, Skeleton). Componente sem irmão fica solto: pasta de um filho só acrescenta profundidade sem ajudar ninguém a achar nada.

### Qual pasta é a sua

A regra acima diz **quando** uma pasta nasce. Esta tabela diz **qual**, para os componentes
que já estão no backlog. Sem ela, quem chegar primeiro inventa o nome -- `Overlay`, `Modais`
e `Sobreposição` para a mesma coisa -- e renomear depois quebra todo link do Storybook
publicado.

| Pasta | Hoje | Quem entra nela |
|---|---|---|
| `Campos` | InputField, TextField | Formulário avançado |
| `Dropdown` | Combobox, Menu, Select, Visão geral | -- |
| `Loading` | Skeleton, Spinner | Progress bar |
| `Dados` | -- | Tabela de dados, Gráficos, Timeline de eventos |
| `Sobreposição` | -- (`Modal` está solto) | Drawer, Modal de confirmação |
| `Feedback` | -- (`Alert` está solto) | Badge/Tag, Status pill, Empty state |
| `Navegação` | -- (`Pagination` está solto) | Tabs, Stepper |
| `Superfícies` | -- (`Card` está solto) | Avatar, Cards de perfil, Cards de métricas |
| `Fundação` | -- | Tipografia, Ícones, paleta de cores |

**Quem cria a pasta move o componente solto para dentro dela, no mesmo PR**, e atualiza esta
tabela. Exemplo: o PR do Drawer cria `Componentes/Sobreposição/Drawer` e muda o `title` do
Modal para `Componentes/Sobreposição/Modal`. São duas linhas.

As pastas vazias não existem de propósito: criar `Sobreposição` hoje, só com o Modal dentro,
é a pasta de um filho que a regra acima recusa.

Dois casos ainda sem casa: o **Button** não tem irmão previsto e fica solto; o **Accordion**
não se encaixa bem em nenhuma -- decida junto com quem for implementar, e registre aqui.

A ordem é alfabética, pelo `storySort` do `.storybook/preview.tsx`. Não há lista a manter: componente novo cai no lugar sozinho.

O mínimo: um `Playground` com controles e uma story por eixo de variante. Declare `argTypes` com `options` e `table.type` à mão — o docgen não extrai tipo de `VariantProps`, que é um mapped type, e a tabela de controles sai vazia sem isso.

Para o design conferir alturas, espaçamentos e raios, crie uma story `Medidas` com o `MeasureTable` de `apps/storybook/src/lib/measurements.tsx`: ele mede o elemento renderizado, não o que a classe promete.

## 4.1. O teste de comportamento

```
packages/ui/test/<nome>.test.tsx
```

Vitest com jsdom e Testing Library. Teste o que a pessoa faz: abrir pelo teclado, escolher, o valor que chega no `onValueChange` ou no formulário, o item desabilitado. Use `userEvent` (export nomeado de `@testing-library/user-event`) e busque elementos pelo papel ARIA (`getByRole`). Visual e animação não entram aqui: ficam no Storybook.

```bash
pnpm --filter @devwebdex/ui test
```

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
| `pnpm test` | testes de comportamento (passo 4.1) e a conferência do CSS compilado (passo 6) |
| `pnpm changeset` | declara o bump de versão. Sem ele o release não publica nada |

## 6. As três falhas que não gritam

Esta cadeia tem três modos de falha em que o build termina com "completed successfully" e a saída sai errada. Vale conhecer, porque o sintoma é sempre "está diferente no Storybook e eu não sei por quê".

**`dist` velho depois de trocar de branch.** O `git checkout` não reconstrói. O Tailwind não acha os tokens, cai no tema padrão dele, e `p-8` vira 2rem em vez dos 64px de `spacing.8`.
→ `pnpm build` depois de todo `checkout`.

**Classe montada em tempo de execução.** O Tailwind só gera o que encontra *escrito* no código. Classe concatenada em variável não existe para ele, e some do CSS sem aviso.
→ Escreva a classe inteira e literal. Se não der, declare em `@source inline(...)` — e, de preferência, gere essa lista a partir do próprio componente, como faz o `.storybook/main.ts` para a Matriz do Button, que força `hover`, `active` e `focus-visible` tirando o prefixo da classe. Só precisa mexer no `main.ts` se o componente novo tiver uma story que monte classe assim.

**`pnpm --filter <pacote> build` pula o turbo.** Roda só o script daquele pacote, sem construir as dependências.
→ Use `pnpm build` ou `pnpm turbo run build --filter=<pacote>`.

Os testes `apps/storybook/test/css-*.test.mjs` existem para pegar as três: eles conferem que os tokens chegaram no CSS publicado e que toda classe que o componente produz tem regra lá.

**Ao criar um componente novo, crie o `css-<nome>.test.mjs` dele.** É um arquivo por componente, e o `node --test` descobre sozinho: não há lista para acrescentar nem para manter. O esqueleto é sempre o mesmo, com os utilitários de `css-helpers.mjs`:

```js
import { classesFromHtml, missingFromCss } from './css-helpers.mjs'

test('toda classe que o Spinner produz existe no CSS compilado', () => {
  assert.deepEqual(missingFromCss(classesFromHtml(html)), [])
})
```

De onde tirar a lista de classes, nesta ordem:

1. **Do `cva`**, percorrendo os eixos — é o caso do Button e do InputField.
2. **Do HTML renderizado** (`classesFromHtml`), quando o componente põe classe fora do `cva`: o símbolo do Alert, a mídia do Card, as células do Spinner. São justamente as que sumiriam sem ninguém notar.
3. **Das classes exportadas**, quando o componente renderiza em portal e o `renderToStaticMarkup` não o desenha — é o caso do Modal, que exporta `modalOverlayClass` e `modalContentVariants` para isso.

O que nunca serve é redigitar a classe no teste: aí ele confere a si mesmo.

O mesmo vale para o `generateForcedStateSource` do `.storybook/main.ts`, se a story tiver uma Matriz com estados forçados.

## 7. A entrega

- Commit no formato `feat(ui): adiciona Spinner`.
- PR para a **`dev`**.
- `pnpm changeset` no mesmo PR: componente novo em `@devwebdex/ui` é **minor**.
- No PR: o que o componente faz, as decisões que fogem do padrão, e a **lista de lacunas** — valor sem token, variante adiada, acessibilidade pendente.

O time de design revisa pelo Storybook publicado, não pelo código. Se o componente só fizer sentido com um token que ainda não existe, diga isso no PR em vez de resolver com valor solto.
