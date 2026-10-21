# Frontend: Vite + React

SPA React servida como arquivos estáticos (`pnpm build` gera `apps/web/dist`). Indicada para painéis e áreas logadas, onde não há necessidade de renderização no servidor.

## Estrutura

```
apps/web/
  index.html            # ponto de entrada
  src/
    main.tsx            # monta o React em #root
    app.tsx             # componente raiz
    pages/              # telas
    components/         # componentes específicos deste produto
    lib/                # funções sem UI (cliente da API, formatação)
```

- Componente genérico e reutilizável entre projetos (botão, input, card) **não** é criado aqui: ele pertence ao `@devwebdex/ui`, mantido pelo time de design. Se faltar, peça ao time de design em vez de criar uma versão local.
- Arquivos em kebab-case; componentes em PascalCase.

## Dados e segurança

- Tudo no `src/` vai para o navegador: nenhum segredo no código nem em variáveis `VITE_*`.
- A API é chamada pelo endereço público dela; autorização sempre checada no backend.

## Estilo

- Só utilitários do Tailwind. Cores, raios, espaçamentos e fontes vêm dos tokens (`bg-brand`, `text-text-primary`, `rounded-2`, `p-4`).
- **Proibido**: cor em hex/rgb no código, valores arbitrários (`p-[13px]`, `bg-[#fff]`), CSS-in-JS, `style` inline para valores visuais.

## Acessibilidade

- Elemento semântico, foco visível em todo elemento interativo, `alt` em imagem, `aria-label` em botão só com ícone, `label` associado a todo campo.
//#if web3=evm

## Carteira (web3)

Regras de carteira e login em [web3.md](web3.md). No `apps/web`:

- `src/lib/web3.ts`: único arquivo que escolhe a rede (`VITE_CHAIN`, `VITE_RPC_URL`) e monta o config do wagmi; `VITE_WALLETCONNECT_PROJECT_ID` vazio desliga o WalletConnect. Variáveis em `apps/web/.env` (modelo em `.env.example`); o Vite as embute no build.
- `src/components/web3-provider.tsx` (no `main.tsx`): `WagmiProvider` e `QueryClientProvider`. Hook do wagmi só em componente abaixo dele.
//#if backend!=none
- `src/components/wallet-login.tsx`: conectar, trocar de rede, entrar (SIWE) e sair. O cliente das rotas `/auth` fica em `src/lib/web3.ts` (`authApi`), com a API em `VITE_API_URL`.
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

`pnpm build`, `pnpm check-types`, `pnpm lint` e `pnpm test` na raiz. Mudança visual: abra a página no navegador e confira.
