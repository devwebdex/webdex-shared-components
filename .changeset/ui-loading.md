---
"@devwebdex/ui": minor
---

Adiciona os componentes de loading.

- `Spinner`: o losango pixelado do design system, que acende do centro para fora nas cores brand-deep, brand e coral. Tamanhos `small` (24px), `medium` (72px) e `large` (106px). Tem `role="status"` e `label` para leitor de tela (padrão "Carregando"). Com movimento reduzido, fica parado.
  - `variant`: `pixel` (o losango, padrão), `ring` (círculo girando) ou `dots` (três pontos em sequência).
  - `tone`: `brand` (cores da marca) ou `current` (cor do texto em volta).
- `Skeleton`: `SkeletonText` (`lines`), `SkeletonAvatar` (`size`: 32, 48 e 64px), `SkeletonCard` e o `Skeleton` base para outras formas. É decorativo (`aria-hidden`); marque a região que carrega com `aria-busy`.
- `Button` ganha `loading`: mostra o losango no lugar do conteúdo, sem mudar a largura, com `aria-busy` e `aria-disabled`. Continua focável, ignora o clique e não envia o formulário.

A animação do Spinner usa o `animate-pixel-cell` do `@devwebdex/tokens` desta versão; com tokens antigos, o losango aparece parado.
