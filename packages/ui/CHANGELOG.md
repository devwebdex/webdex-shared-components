# @devwebdex/ui

## 0.2.0

### Minor Changes

- a8ba5cd: Adiciona o InputField e o TextField.
  
  **InputField**: o `<input>` sozinho, com um eixo `status` (default, error,
  success). `error` liga o `aria-invalid`. Hover, focus e disabled não são props:
  são pseudo-classes (`hover:`, `focus-visible:`, `disabled:`).
  
  **TextField**: rótulo, InputField, helper text e contador de caracteres
  (`counter`, que com `maxLength` exibe `atual/máximo`). O helper text e o
  contador ficam ligados ao input por `aria-describedby`. `className` vai para o
  contêiner; para estilizar o input, use `inputClassName`.
- ef8e2dc: Adiciona o Alert, com as variantes info, warning, error e success, seguindo o bloco
  Alertas do design system (`docs/ui/webdex-design-system.html`). Título opcional em
  negrito, símbolo por variante (troca ou esconde com `icon`) e `role` padrão por
  variante: `alert` em error e warning, `status` em info e success.
- 155a26b: Adiciona `Select` (escolha de um valor, padrão ARIA listbox), `Menu` (lista de ações, padrão ARIA menu) e `Combobox` (escolha com busca), sobre os primitivos do Radix (`radix-ui`) e o `cmdk`.
  
  - Eixos `size` (`large`, `medium`, `small`, nas alturas do Button) e `radius` (os tokens de raio `0` a `5` e `full`); a lista é compartilhada (`listPopupVariants`, `listItemVariants`).
  - Opções do Select e do Combobox com `icon` (ex.: símbolo da rede), mostrado na lista e no campo; ações do Menu com `icon` e `tone: 'danger'`.
  - Combobox: busca pelo rótulo e pelas `keywords` da opção, mensagem de lista vazia (`emptyMessage`) e `name` para enviar o valor num formulário.
  - Menu com gatilho padrão (`label`): um Button com a seta, que gira ao abrir; `trigger` aceita um gatilho próprio. Como no Select e no Combobox, `className` vai para o gatilho; `radius` arredonda só a lista.
  - `attention`: halo que pulsa em volta do gatilho para chamar a atenção. Some ao abrir e, depois, quando há valor (Select e Combobox) ou depois da primeira abertura (Menu).
  - A lista abre crescendo a partir do gatilho (`@starting-style`) e fecha com a animação `animate-list-out` dos tokens; o item em destaque ganha uma barra na borda esquerda. Movimento reduzido desliga as animações.
  - Item desabilitado estilizado por `aria-disabled`.
  - `selectTriggerVariants` (o gatilho do Select e do Combobox) fica num módulo sem `'use client'`: pode ser chamado num Server Component.
  - O pacote passa a depender de `radix-ui` e `cmdk` e a exigir `react-dom` do projeto. Atualize o `@devwebdex/tokens` junto: a animação de fechar usa o `animate-list-out`, que chega nesta versão dos tokens; com tokens antigos a lista fecha sem animação.
- 8bdeee4: Importa as Variables do Figma como tokens DTCG e adiciona o Button.
  
  **Tokens**: as 5 coleções do arquivo WEbdEX — Design System viram 7 arquivos DTCG
  (40 cores, 8 espaçamentos, 7 raios, famílias, pesos, tamanhos e elevações). Os
  valores provisórios da 0.1.0 saem, e com eles os tokens `color.primary`,
  `color.on-primary`, `color.surface`, `color.on-surface`, `radius.md` e
  `spacing.md`, que não existem mais. Os tamanhos de fonte (`text.sm`, `.base`,
  `.lg`) são provisórios: foram lidos do componente, não de Variable.
  
  **Button**: três eixos espelhando as component properties do Figma — `size`
  (large, medium, small), `color` (brand, code) e `variant` (contained, outlined,
  text) — com ícones como slots. Hovered, Pressed, Disabled e Focused não são
  props: são pseudo-classes (`hover:`, `active:`, `disabled:`, `focus-visible:`).
