# Frontend: Inertia + React (AdonisJS)

O AdonisJS serve as páginas React pelo Inertia: as rotas ficam no backend (`start/routes.ts`) e cada rota escolhe um componente de página com as props dela. Não há API intermediária nem roteador no cliente.

## Estrutura

```
apps/api/
  inertia/
    app.tsx              # inicializa o Inertia no navegador
    pages/<pagina>.tsx   # uma página por arquivo; o nome é o usado em renderInertia('<pagina>')
    components/          # componentes específicos deste produto
    css/app.css          # Tailwind + tokens
  resources/views/inertia_layout.edge   # HTML base
```

- Página nova: crie `inertia/pages/<pagina>.tsx` e a rota (`router.on('/caminho').renderInertia('<pagina>')` ou um controller que chama `inertia.render('<pagina>', props)`).
- Componente genérico e reutilizável entre projetos **não** é criado aqui: ele pertence ao `@devwebdex/ui`, mantido pelo time de design.

## Dados e segurança

- Os dados chegam como props da página, montadas no controller; não há chamada de API para dados da própria página.
- Props vão para o navegador: nunca passe segredo, hash de senha ou campo interno. Monte props explícitas, não o model inteiro.
- Autorização sempre no controller, antes de renderizar.

## Estilo e acessibilidade

- Só utilitários do Tailwind ligados aos tokens; proibido hex, valor arbitrário e `style` inline para valores visuais.
- Elemento semântico, foco visível, `alt` em imagem, `label` em todo campo.

## Antes de entregar

`pnpm build`, `pnpm check-types`, `pnpm lint` e `pnpm test` na raiz; `pnpm test:e2e` cobre as páginas pelo Japa.
