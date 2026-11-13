# Trabalhar em paralelo sem conflito

Várias tarefas de componente vão correr ao mesmo tempo. Este documento diz onde elas se
atropelam e o que fazer para não acontecer.

O que está aqui foi medido neste repositório, não é precaução genérica.

## Antes de tudo: a linha "tema claro e escuro" da DoD

**Hoje, nenhum componente cumpre essa linha, e não dá para cumprir sozinho.**

O tema claro não existe neste repositório. Não é que esteja incompleto -- não há mecanismo
nenhum:

```
$ grep -rniE 'prefers-color-scheme|data-theme|\.dark|\.light|light-dark\(' \
    packages/tokens/src apps/storybook/.storybook packages/ui/src
(nada)
```

O `packages/tokens/dist/theme.css` gerado tem um `@theme` só, com um valor por token. E
**14 dos 41 tokens de cor têm alpha embutido** -- `line-default` é `rgba(255,255,255,0.10)`,
`danger-bg` é `rgba(255,92,64,0.14)`. Branco a 10% só se lê sobre fundo escuro. Sobre fundo
claro ele some. Esses 14 tokens não têm "versão clara" óbvia: precisam ser rederivados no
Figma, um a um, com o design decidindo cada valor.

O `preview.tsx` do Storybook já diz isso em comentário: *"O design system é só escuro: as
cores com alpha só se leem sobre o fundo da marca."*

### Por que isso é um problema de merge, e não só uma pendência

Se dez pessoas receberem "funcionando nos temas claro e escuro" como critério de aceite sem
que o mecanismo exista, cada uma inventa o seu. Uma usa `prefers-color-scheme`, outra uma
classe `.dark` na raiz, outra um `data-theme`, outra uma prop `theme` no componente. O Git
mescla as dez sem um único conflito -- e o resultado não funciona, porque são quatro
mecanismos incompatíveis convivendo. Esse é o conflito caro: o que o Git não vê.

### O combinado

1. **A tarefa de tema vem antes e sozinha.** Nada de componente novo em paralelo com ela.
2. **Até ela entrar, a DoD das outras tarefas é "só escuro".** Risque a linha do tema.
3. Quando a tarefa de tema for escrita, ela **não é** "revisar os 12 componentes". Ver abaixo.

### Como a tarefa de tema deve ser feita

Os componentes não usam cor crua: usam classe de token (`bg-surface-card`,
`text-text-primary`). Essas classes viram `var(--color-surface-card)`. Então **trocar o tema
é redefinir as variáveis, não mexer nos componentes.** A tarefa certa toca
`packages/tokens` e o `preview.tsx`, e mais nada:

```css
/* uma origem só para os dois temas */
:root { --color-surface-card: <escuro>; }
:root[data-theme='light'] { --color-surface-card: <claro>; }
```

Escrita assim, ela **não conflita com nenhuma PR de componente** -- mexe em arquivos que
ninguém mais está tocando. Escrita como "revisar Alert, Button, InputField, ..." ela toca os
12 componentes e colide com toda PR aberta no mesmo dia.

A exceção são as cores que o componente escolhe pela **primitiva**, e não pelo papel. Elas
não acompanham a troca de variável, porque branco continua branco no tema claro. Restam onze
usos, todos no Button:

| Onde | O quê |
|---|---|
| `disabled:` do Contained, nas duas cores (×2) | `bg-[#4f4f4f]/15` -- hex à mão, fora da paleta |
| `disabled:` de todas as variantes (×8) | `text-white-disabled`, `inset-ring-white-disabled` |
| `hover:` do Contained na cor `code` (×1) | `inset-ring-white/50` |

Os do meio já são token -- a escada de estado do Figma aplicada ao branco --, mas a
primitiva `white`. O Figma tem a mesma escada para `black`: num tema claro, esses usos
teriam de virar `black-*`, ou ganhar um token de papel (`disabled-text`) que troque de
primitiva com o tema. Isso é uma segunda tarefa, separada, que toca componente: entra
**sozinha**, não junto com a do tema.

## Conflito garantido: `packages/ui/src/index.ts`

Mudou em **10 dos últimos 60 commits**. É o segundo arquivo mais tocado do repositório.

Toda tarefa que cria componente acrescenta uma linha nesse arquivo, e todas no mesmo bloco
ordenado alfabeticamente. Duas PRs abertas no mesmo dia conflitam ali, sempre.

A resolução é trivial -- **ficam os dois lados**, em ordem alfabética:

```
<<<<<<< HEAD
export * from './components/avatar/index.js'
=======
export * from './components/badge/index.js'
>>>>>>> main
```
vira
```
export * from './components/avatar/index.js'
export * from './components/badge/index.js'
```

Nunca escolha um lado. Escolher um lado aqui apaga o componente da outra pessoa da API
pública, e **nada falha**: o build passa, os testes passam, o componente só não existe para
quem instalar o pacote.

Para facilitar a vida de quem revisa: deixe a linha do `index.ts` no **último commit** da sua
branch. Um rebase resolve um commit de uma linha, não o seu trabalho inteiro.

## Um arquivo por componente, sempre

O `apps/storybook/test/css.test.mjs` mudou **15 vezes em 60 commits** e conflitou nas quatro
PRs de componente que entraram num mesmo dia: cada uma acrescentava o seu bloco no mesmo
lugar do mesmo arquivo. Ele foi quebrado em `css-<componente>.test.mjs`, e o problema sumiu.

Siga o mesmo princípio em tudo:

- teste de CSS: `apps/storybook/test/css-<componente>.test.mjs` -- arquivo novo
- story: `apps/storybook/src/stories/<componente>.stories.tsx` -- arquivo novo
- teste de comportamento: `packages/ui/test/<componente>.test.tsx` -- arquivo novo
- changeset: `pnpm changeset` gera nome aleatório -- nunca conflita

**Não acrescente seu componente a nenhuma lista compartilhada.** Se encontrar uma lista que
precisa ser editada a cada componente novo, ela é um gerador de conflito: avise, em vez de
alimentá-la.

Há uma exceção, estreita de propósito: a tabela **"Qual pasta é a sua"** em
[criar-componente.md](criar-componente.md). Ela diz em que pasta do Storybook cada componente
do backlog entra, para que `Overlay`, `Modais` e `Sobreposição` não nasçam como três nomes da
mesma coisa. Só quem **cria uma pasta** mexe nela, e só na linha da sua pasta -- são umas
cinco edições no total, não uma por componente. Leia antes de escolher o `title` da sua story.

Os dois arquivos restantes com esse formato são `docs/gerador-de-projetos.md` (13 mudanças) e
`docs/ui/criar-componente.md` (11). Se precisar editar um deles, acrescente **ao fim** da
seção, nunca no meio: conflito no fim de bloco é mais fácil de ler.

## Componentes que são o mesmo componente

Na lista de tarefas há pares que duas pessoas vão construir duas vezes:

- **Badge/Tag** e **Status pill** -- um rótulo colorido com texto; a pill tem um ponto na
  frente. É um componente com uma prop, não dois componentes.
- **Timeline de eventos** e o card de atividades dos **Cards de perfil** -- o segundo usa o
  primeiro, segundo o próprio enunciado.
- **Empty state** aparece dentro de **Tabela de dados** e de **Gráficos**.

Quem pegar o segundo de cada par espera o primeiro entrar. Duas implementações da mesma coisa
não dão conflito de Git -- dão dois componentes parecidos na API pública para sempre.

## Antes de abrir a PR

```sh
git fetch origin
git rebase origin/dev        # resolva aqui, não no merge da PR
pnpm build && pnpm check-types && pnpm lint && pnpm test
```

O rebase antes de abrir é o que transforma um conflito de três PRs num conflito de uma.

Mudou pacote publicável (`packages/*`, `apps/create`)? A PR precisa de um changeset:
`pnpm changeset`. Não edite versão nem CHANGELOG à mão.
