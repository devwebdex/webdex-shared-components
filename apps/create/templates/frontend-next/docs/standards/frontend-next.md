# Frontend: Next.js + Tailwind

## Estrutura

```
apps/web/src/
  app/              # rotas (App Router): page.tsx, layout.tsx, loading.tsx, error.tsx
  components/       # componentes específicos deste produto
  lib/              # funções sem UI (clientes de API, formatação)
```

- Componente genérico e reutilizável entre projetos (botão, input, card) **não** é criado aqui: ele pertence ao `@devwebdex/ui`, mantido pelo time de design. Se faltar, peça ao time de design em vez de criar uma versão local.
- `src/components/` é para composições do produto (ex.: `order-summary.tsx`) feitas a partir dos componentes do `@devwebdex/ui`.
- Arquivos em kebab-case; componentes em PascalCase. Import absoluto com `@/` (ex.: `@/components/order-summary`).

## Server e Client Components

- Por padrão tudo é Server Component. `'use client'` só no menor componente que precisa de estado, efeito, evento ou API do navegador.
- Busca de dados no servidor (Server Component ou Server Action), não em `useEffect`.
- Segredo nunca em Client Component nem em variável `NEXT_PUBLIC_*`.

## Estilo

- Só utilitários do Tailwind. Cores, raios, espaçamentos e fontes vêm dos tokens (`bg-primary`, `rounded-md`, `p-md`).
- **Proibido**: cor em hex/rgb no código, valores arbitrários (`p-[13px]`, `bg-[#fff]`), CSS-in-JS, `style` inline para valores visuais.
- Valor do design sem token correspondente é lacuna de design: reporte ao time de design.

## Acessibilidade

- Elemento semântico (`button`, `a`, `nav`, `main`, `label`), foco visível em todo elemento interativo, `alt` em toda imagem, `aria-label` em botão só com ícone.
- Formulário: todo campo com `label` associado e mensagem de erro ligada por `aria-describedby`.

## Antes de entregar

`pnpm build`, `pnpm check-types` e `pnpm lint` na raiz. Mudança visual: abra a página no navegador e confira.
