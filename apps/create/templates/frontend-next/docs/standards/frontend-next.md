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

- Só utilitários do Tailwind. Cores, raios, espaçamentos e fontes vêm dos tokens (`bg-brand`, `text-text-primary`, `rounded-2`, `p-4`).
- **Proibido**: cor em hex/rgb no código, valores arbitrários (`p-[13px]`, `bg-[#fff]`), CSS-in-JS, `style` inline para valores visuais.
- Valor do design sem token correspondente é lacuna de design: reporte ao time de design.

## Acessibilidade

- Elemento semântico (`button`, `a`, `nav`, `main`, `label`), foco visível em todo elemento interativo, `alt` em toda imagem, `aria-label` em botão só com ícone.
- Formulário: todo campo com `label` associado e mensagem de erro ligada por `aria-describedby`.
//#if web3=evm

## Carteira (web3)

Regras de carteira e login em [web3.md](web3.md). No `apps/web`:

- `src/lib/web3.ts`: único arquivo que escolhe a rede (`NEXT_PUBLIC_CHAIN`, `NEXT_PUBLIC_RPC_URL`) e monta o config do wagmi; `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` vazio desliga o WalletConnect. Variáveis em `apps/web/.env` (modelo em `.env.example`); o Next as embute no build.
- `src/components/web3-provider.tsx` (no `layout.tsx`): `WagmiProvider` e `QueryClientProvider`, Client Component. Hook do wagmi só em Client Component abaixo dele.
- SSR: o config usa `ssr: true` e a interface da carteira só aparece depois da hidratação (`useHydrated` em `wallet-login.tsx`), porque as carteiras do navegador não existem no servidor. Sem cookie do wagmi, a página continua estática.
//#if backend!=none
- `src/components/wallet-login.tsx`: conectar, trocar de rede, entrar (SIWE) e sair. O cliente das rotas `/auth` fica em `src/lib/web3.ts` (`authApi`), com a API em `NEXT_PUBLIC_API_URL`.
//#if session=cookie
- Sessão em cookie `HttpOnly`: toda chamada à API usa `credentials: 'include'`.
//#else
- Sessão por token só em memória (variável do módulo), enviado em `Authorization: Bearer`. Nunca em `localStorage` nem cookie legível por JavaScript.
//#endif
//#else
- `src/components/wallet-login.tsx`: conectar, trocar de rede e desconectar.
//#endif
- Testes com o conector `mock` do wagmi e `fetch` simulado (`wallet-login.test.tsx`), sem carteira nem rede reais.
//#endif

## Antes de entregar

`pnpm build`, `pnpm check-types` e `pnpm lint` na raiz. Mudança visual: abra a página no navegador e confira.
