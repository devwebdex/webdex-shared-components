---
"@devwebdex/ui": minor
---

Adiciona `Select` (escolha de um valor, padrão ARIA listbox) e `Menu` (lista de ações, padrão ARIA menu), sobre os primitivos do Radix (`radix-ui`).

- Eixos `size` (`large`, `medium`, `small`, nas alturas do Button) e `radius` (os tokens de raio `0` a `5` e `full`); a lista é compartilhada (`listPopupVariants`, `listItemVariants`).
- Opções do Select com `icon` (ex.: símbolo da rede), mostrado na lista e no campo; ações do Menu com `icon` e `tone: 'danger'`.
- Menu com gatilho padrão (`label`): um Button com a seta, que gira ao abrir; `trigger` aceita um gatilho próprio.
- `attention`: halo que pulsa em volta do gatilho para chamar a atenção; some ao abrir.
- A lista abre crescendo a partir do gatilho (`@starting-style`, sem CSS extra no pacote); o item em destaque ganha uma barra na borda esquerda. Movimento reduzido desliga as animações.
- O pacote passa a depender de `radix-ui` e a exigir `react-dom` do projeto.
