# @devwebdex/ui

## 0.3.0

### Minor Changes

- 4abcbcf: Adiciona o Modal e o ConfirmModal.
  
  **Modal**: sobre o Dialog do Radix. Header com título, descrição, ícone e botão
  de fechar; conteúdo que rola entre header e footer fixos, focável para rolar
  pelo teclado; footer de ações. Tamanhos `sm` (400px), `md` (560px) e `lg`
  (800px). O fundo escurecido usa o token `opacity.overlay`. `ModalClose` fecha o
  modal a partir de um botão do footer.
  
  **ConfirmModal**: a variação de confirmação (ex.: conectar a carteira), sobre o
  AlertDialog. Não fecha com clique fora, põe o foco em Cancelar ao abrir e, se o
  `onConfirm` devolver uma promessa, desabilita os botões e o Esc até ela
  terminar. Fecha quando a promessa resolve; se ela rejeitar, continua aberto.
- 69ed441: Novo componente `Card`: uma superfície que agrupa mídia (`media`), header (`title`), conteúdo (`children`) e ações (`actions`), nessa ordem. Estreia os tokens `color.surface-card` e `color.surface-elevated`, que existiam nas Variables do Figma sem consumidor, e reusa a `shadow.elevation-2` do Button em repouso.
  
  Os três estados seguem a regra de `docs/ui/criar-componente.md`: `hover` é modificador de classe e `selected` é prop. O hover só aparece com `interactive`, porque um card que levanta ao passar o mouse e não responde ao clique promete uma afordância que não existe.
  
  O hover **não** usa a `shadow.elevation-4` do Button. As elevações `paper/*` são pretas, e preto a 20% sobre o `background` `#0c0611` escurece 2 pontos por canal: não se vê. No Button o hover aparece porque ele também troca de cor; o card só tinha a sombra. Por isso os tokens ganham a **`shadow.glow-brand`** — a mesma sombra na cor da marca —, que o card usa no hover. É token provisório, com a razão na `$description`: não veio do Figma, e se o design quiser outro sinal de hover para superfície, é ali que muda.
  
  O brilho é sombra, então é aditivo: funciona igual com `selected`, que já usa a borda e a superfície.
  
  O slot **`media`** é a mídia sangrada do topo: o Card desfaz o próprio `p-4` com `-mt-4 -mx-4`, arredonda o topo no `radius.3` e recorta o que passar. Quem monta a tela passa só o conteúdo — uma `<img>`, uma faixa com o símbolo do ativo — sem margem negativa nem largura calculada. Uma `<img>` direta ganha `w-full`, porque elemento substituído não estica no flex.
  
  Sem o slot, a mídia teria de entrar em `children`, que vem depois de `title`: a margem negativa não teria o `p-4` para cancelar, comeria o `gap-3` e espremeria a imagem contra o título. E a conta depende do padding e do raio do próprio Card, então, feita de fora, toda tela a repete e todas erram juntas quando o Card mudar.
  
  Atualize o `@devwebdex/tokens` junto com o `@devwebdex/ui`: com tokens antigos o `Card` fica sem hover visível.
- 0188f82: Adiciona os componentes de loading.
  
  - `Spinner`: o losango pixelado do design system, que acende do centro para fora nas cores brand-deep, brand e coral. Tamanhos `small` (24px), `medium` (72px) e `large` (106px). Tem `role="status"` e `label` para leitor de tela (padrão "Carregando"). Com movimento reduzido, fica parado.
    - `variant`: `pixel` (o losango, padrão), `ring` (círculo girando) ou `dots` (três pontos em sequência).
    - `tone`: `brand` (cores da marca) ou `current` (cor do texto em volta).
  - `Skeleton`: `SkeletonText` (`lines`), `SkeletonAvatar` (`size`: 32, 48 e 64px), `SkeletonCard` e o `Skeleton` base para outras formas. É decorativo (`aria-hidden`); marque a região que carrega com `aria-busy`.
  - `Button` ganha `loading`, com `aria-busy` e `aria-disabled`: continua focável, ignora o clique e não envia o formulário.
    - `loadingIndicator`: `ring` (padrão), `pixel` ou `dots`, na cor do texto.
    - `loadingPosition`: `start` (padrão, no lugar do ícone da esquerda, com o rótulo visível), `end` (no lugar do da direita) ou `center` (rótulo escondido, sem mudar a largura).
    - `loadingText`: rótulo durante o carregamento (ex.: "Salvando…"), que vira o nome acessível.
  
  A animação do Spinner usa o `animate-pixel-cell` do `@devwebdex/tokens` desta versão; com tokens antigos, o losango aparece parado.
- 797616e: Adiciona a Pagination: anterior, próximo e os números de página, com reticências quando há
  muitas páginas. Os estados seguem o item de navegação do design system: normal, hover, ativo
  (a página atual, marcada com `aria-current="page"`) e disabled (as setas nas pontas). Funciona
  controlada (`page` e `onPageChange`) ou sozinha (`defaultPage`).
  
  `paginationItemClass`, a classe do item, fica num módulo sem `'use client'`: dá para usar num
  Server Component, por exemplo para estilizar um link de página.

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
