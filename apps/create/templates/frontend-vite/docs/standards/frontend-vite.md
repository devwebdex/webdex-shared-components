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

- Só utilitários do Tailwind. Cores, raios, espaçamentos e fontes vêm dos tokens (`bg-primary`, `rounded-md`, `p-md`).
- **Proibido**: cor em hex/rgb no código, valores arbitrários (`p-[13px]`, `bg-[#fff]`), CSS-in-JS, `style` inline para valores visuais.

## Acessibilidade

- Elemento semântico, foco visível em todo elemento interativo, `alt` em imagem, `aria-label` em botão só com ícone, `label` associado a todo campo.

## Antes de entregar

`pnpm build`, `pnpm check-types`, `pnpm lint` e `pnpm test` na raiz. Mudança visual: abra a página no navegador e confira.
