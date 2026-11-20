---
"@devwebdex/ui": minor
---

Adiciona a Drawer: painel que abre pela lateral, sobre o conteúdo, com o fundo escurecido. É o
Dialog do Radix do Modal, com foco preso, Esc, clique fora e rolagem da página travada. Header
com título, descrição e botão de fechar; conteúdo que rola; footer de ações preso embaixo.
`side` (`right` ou `left`) e `size` (`sm` 400px, `md` 560px, `lg` 800px, as larguras do Modal).
`DrawerClose` fecha a gaveta a partir de um botão do footer.

Atualize o `@devwebdex/tokens` junto: a saída desliza com `animate-slide-out-right` e
`animate-slide-out-left`, que chegam nesta versão dos tokens; com tokens antigos a gaveta fecha
sem animação.
