# Trabalhar em paralelo sem conflito

Várias tarefas de componente vão correr ao mesmo tempo. Este documento diz onde elas se
atropelam e o que fazer para não acontecer.

O que está aqui foi medido neste repositório, não é precaução genérica.

## Antes de tudo: a linha "tema claro e escuro" da DoD

O modo claro existe desde os gráficos (D19 em [gerador-de-projetos.md](../gerador-de-projetos.md)),
e é **provisório**: o Figma só tem o modo escuro, e os valores claros são proposta para o design
validar (A7).

- `data-theme="light"` no `<html>`, ou em qualquer contêiner, troca as cores. Sem ele, vale o
  escuro.
- Os valores claros ficam em `packages/tokens/modes/light.json`, só as cores que mudam. O build
  deriva o resto: as escadas de estado (`-hover`, `-focus`...) e os fundos `-bg` saem da base
  clara com o mesmo alpha do escuro.
- No Storybook, o seletor de tema fica na barra de ferramentas.

Trocar o tema é redefinir as variáveis, não mexer nos componentes. Os componentes usam classe
de token de papel (`bg-surface-card`, `text-text-primary`), que vira `var(--color-surface-card)`:
quem usa só isso já funciona nos dois modos.

### O combinado

1. **Só token de papel.** Nada de primitiva (`text-white`, `white/50`) nem hex
   (`bg-[#4f4f4f]`): branco continua branco no modo claro e some sobre o fundo.
2. **Um mecanismo só: o `data-theme`.** Nada de `prefers-color-scheme`, classe `.dark` ou prop
   `theme` no componente. O Git mescla quatro mecanismos diferentes sem um único conflito, e o
   resultado não funciona. Esse é o conflito caro: o que o Git não vê.
3. **Confira nos dois modos no Storybook antes de abrir a PR.** É isso que cumpre a linha da
   DoD.
4. **Cor nova que muda no claro:** o token entra em `packages/tokens/src` e o valor claro em
   `modes/light.json`, na mesma PR. Sem o valor claro, a cor fica igual nos dois modos. O build
   para se `light.json` tiver uma cor que o escuro não tem.
5. **Não discuta o valor claro na PR de componente.** Ele é proposta até o design validar (A7).
   Achou um valor ruim? Anote para o design.

### O que ainda não acompanha o tema

**Texto `brand` sobre fundo claro** fica em 3,76:1, abaixo dos 4,5:1 de texto (variantes
`outlined` e `text` do Button). Resolver pede uma decisão do design: escurecer a marca no claro
ou usar `brand-deep` para texto.

**Cores escolhidas pela primitiva**, e não pelo papel, ficam iguais nos dois modos: branco
continua branco. Restam onze usos, todos no Button. No modo claro, o Button desabilitado fica
com texto branco quase transparente sobre fundo quase branco:

| Onde | O quê |
|---|---|
| `disabled:` do Contained, nas duas cores (×2) | `bg-[#4f4f4f]/15` -- hex à mão, fora da paleta |
| `disabled:` de todas as variantes (×8) | `text-white-disabled`, `inset-ring-white-disabled` |
| `hover:` do Contained na cor `code` (×1) | `inset-ring-white/50` |

Os do meio já são token -- a escada de estado do Figma aplicada ao branco --, mas a
primitiva `white`. O Figma tem a mesma escada para `black`: no modo claro, esses usos teriam
de virar `black-*`, ou ganhar um token de papel (`disabled-text`) que troque de primitiva com
o tema. É uma tarefa que toca componente: entra **sozinha**, não junto com outra do Button.

## Conflito garantido: `packages/ui/src/index.ts`

Mudou em **10 dos últimos 60 commits**: o quarto arquivo mais tocado do repositório, e o
segundo de código.

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
