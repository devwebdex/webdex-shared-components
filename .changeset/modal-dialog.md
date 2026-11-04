---
"@devwebdex/ui": minor
---

Adiciona o Modal e o ConfirmModal.

**Modal**: sobre o Dialog do Radix. Header com título, descrição, ícone e botão
de fechar; conteúdo que rola entre header e footer fixos, focável para rolar
pelo teclado; footer de ações. Tamanhos `sm` (400px), `md` (560px) e `lg`
(800px). O fundo escurecido usa o token `opacity.overlay`. `ModalClose` fecha o
modal a partir de um botão do footer.

**ConfirmModal**: a variação de confirmação (ex.: conectar a carteira), sobre o
AlertDialog. Não fecha com clique fora, põe o foco em Cancelar ao abrir e, se o
`onConfirm` devolver uma promessa, desabilita os botões e o Esc até ela
terminar. Fecha quando a promessa resolve; se ela rejeitar, continua aberto.
