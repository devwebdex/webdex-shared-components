---
"@devwebdex/ui": minor
---

Adiciona `Select` (escolha de um valor, padrão ARIA listbox), `Menu` (lista de ações, padrão ARIA menu) e `Combobox` (escolha com busca), sobre os primitivos do Radix (`radix-ui`) e o `cmdk`.

- Eixos `size` (`large`, `medium`, `small`, nas alturas do Button) e `radius` (os tokens de raio `0` a `5` e `full`); a lista é compartilhada (`listPopupVariants`, `listItemVariants`).
- Opções do Select e do Combobox com `icon` (ex.: símbolo da rede), mostrado na lista e no campo; ações do Menu com `icon` e `tone: 'danger'`.
- Combobox: busca pelo rótulo e pelas `keywords` da opção, mensagem de lista vazia (`emptyMessage`) e `name` para enviar o valor num formulário.
- Menu com gatilho padrão (`label`): um Button com a seta, que gira ao abrir; `trigger` aceita um gatilho próprio. Como no Select e no Combobox, `className` vai para o gatilho; `radius` arredonda só a lista.
- `attention`: halo que pulsa em volta do gatilho para chamar a atenção. Some ao abrir e, depois, quando há valor (Select e Combobox) ou depois da primeira abertura (Menu).
- A lista abre crescendo a partir do gatilho (`@starting-style`) e fecha com a animação `animate-list-out` dos tokens; o item em destaque ganha uma barra na borda esquerda. Movimento reduzido desliga as animações.
- Item desabilitado estilizado por `aria-disabled`.
- `selectTriggerVariants` (o gatilho do Select e do Combobox) fica num módulo sem `'use client'`: pode ser chamado num Server Component.
- O pacote passa a depender de `radix-ui` e `cmdk` e a exigir `react-dom` do projeto. Atualize o `@devwebdex/tokens` junto: a animação de fechar usa o `animate-list-out`, que chega nesta versão dos tokens; com tokens antigos a lista fecha sem animação.
