---
"@devwebdex/ui": minor
---

Adiciona a Pagination: anterior, próximo e os números de página, com reticências quando há
muitas páginas. Os estados seguem o item de navegação do design system: normal, hover, ativo
(a página atual, marcada com `aria-current="page"`) e disabled (as setas nas pontas). Funciona
controlada (`page` e `onPageChange`) ou sozinha (`defaultPage`).

`paginationItemClass`, a classe do item, fica num módulo sem `'use client'`: dá para usar num
Server Component, por exemplo para estilizar um link de página.
