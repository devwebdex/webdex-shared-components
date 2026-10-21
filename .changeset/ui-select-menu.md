---
"@devwebdex/ui": minor
---

Adiciona `Select` (escolha de um valor, padrão ARIA listbox), `Menu` (lista de ações, padrão ARIA menu) e `Combobox` (escolha com busca), sobre os primitivos do Radix (`radix-ui`) e o `cmdk`.

- Eixos `size` (`large`, `medium`, `small`, nas alturas do Button) e `radius` (os tokens de raio `0` a `5` e `full`); a lista é compartilhada (`listPopupVariants`, `listItemVariants`).
- Opções do Select e do Combobox com `icon` (ex.: símbolo da rede), mostrado na lista e no campo; ações do Menu com `icon` e `tone: 'danger'`.
- Combobox: busca pelo rótulo e pelas `keywords` da opção, mensagem de lista vazia (`emptyMessage`) e `name` para enviar o valor num formulário.
- Menu com gatilho padrão (`label`): um Button com a seta, que gira ao abrir; `trigger` aceita um gatilho próprio.
- `attention`: halo que pulsa em volta do gatilho para chamar a atenção. Some ao abrir e, depois, quando há valor (Select e Combobox) ou depois da primeira abertura (Menu).
- A lista abre crescendo a partir do gatilho (`@starting-style`) e fecha com a animação `animate-list-out` dos tokens; o item em destaque ganha uma barra na borda esquerda. Movimento reduzido desliga as animações.
- Item desabilitado estilizado por `aria-disabled`.
- O pacote passa a depender de `radix-ui` e `cmdk` e a exigir `react-dom` do projeto. A animação de fechar exige o `@devwebdex/tokens` desta versão.
