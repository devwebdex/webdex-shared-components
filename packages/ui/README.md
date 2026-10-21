# @devwebdex/ui

Componentes React da WEbdEX.

O componente nasce em código e o Figma entra como revisão, não como origem: ver
[docs/ui/html-primeiro.md](../../docs/ui/html-primeiro.md).

Passo a passo para criar um componente, com os comandos e as armadilhas da cadeia
de build: [docs/ui/criar-componente.md](../../docs/ui/criar-componente.md).

O pacote **não envia CSS** -- só nomes de classe do Tailwind. Quem consome compila,
importando os tokens de `@devwebdex/tokens/theme.css` e varrendo este pacote com
`@source`.
