# Publicação dos pacotes `@devwebdex/*`

Publicar é enviar uma versão numerada de cada pacote (`@devwebdex/ui@0.3.0`, por exemplo) para o GitHub Packages da conta `devwebdex` ("WEbdEX - Development"). `devwebdex` é uma **conta de usuário**, não uma organização do GitHub: as configurações do repositório e dos pacotes exigem o login dessa conta. Depois disso, qualquer projeto instala o pacote e o gerador roda com `bunx @devwebdex/create`. **Versão publicada é imutável**: uma correção sai como versão nova, nunca sobrescreve a anterior.

Decisões (operador, 2026-10-14): versões **independentes** por pacote e publicação **só por PR de release aprovado**.

## Por que instalar exige token, mesmo com o repositório público

Este repositório é público, e mesmo assim ninguém instala `@devwebdex/ui` sem um token. Isso **não é configuração nossa**: o GitHub Packages exige autenticação para instalar qualquer pacote npm, público ou privado. A [documentação do GitHub](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) diz, com todas as letras, que o token é necessário para "publish, install, and delete private, internal, **and public** packages".

Vale escrever isto porque a conclusão natural é a oposta: quem vê um repositório aberto e um pedido de token assume que alguém esqueceu de liberar alguma coisa.

Na prática:

- **No time**: cada pessoa gera um token clássico com `read:packages` uma vez e põe no `~/.npmrc` (item 2 da tabela de configuração). Projeto gerado pelo `@devwebdex/create` já vem com o `.npmrc` apontando o escopo `@devwebdex` para o registro certo; o que falta é só o token, que é pessoal e por isso nunca vai para o repositório.
- **No CI do GitHub Actions**: o `GITHUB_TOKEN` já serve, e é assim que o `release.yml` publica.
- **Para alguém de fora**: é barreira real. Se um dia a intenção for uso público de verdade, o caminho é publicar no npm público — o `publishConfig` dos pacotes é o único lugar a mudar, mas aí entram decisões de nome, escopo e dono da conta.

## Fluxo do dia a dia

1. **No PR que altera um pacote**, rode `pnpm changeset` e responda:
   - quais pacotes mudaram;
   - o tipo de cada mudança (tabela abaixo);
   - um resumo de uma linha, que vai para o CHANGELOG.

   Isso cria um arquivo em `.changeset/`. Commite junto com a mudança.
2. **O CI** (`.github/workflows/ci.yml`) roda lint, tipos e testes, e gera 18 combinações de projeto com os pacotes do PR (build, tipos, lint, testes e, com backend, banco, migrações e testes e2e).
3. **Depois do merge na `prod`**, o workflow de release (`.github/workflows/release.yml`) abre ou atualiza o PR **"chore: versionar pacotes"**, que:
   - sobe a versão de cada pacote com changeset;
   - escreve o `CHANGELOG.md` de cada um;
   - atualiza as faixas `@devwebdex/*` dentro dos templates do gerador e, se algum template mudou, sobe o patch do `@devwebdex/create`, porque o conteúdo publicado dele mudou.
4. **Alguém revisa e faz o merge desse PR.** O workflow roda de novo, agora sem changesets pendentes, e publica no GitHub Packages as versões novas.

Vários PRs com changesets podem se acumular antes do release; o PR de versão vai sendo atualizado até alguém fazer o merge.

## Qual tipo escolher

| Tipo | Quando | Exemplo |
|---|---|---|
| `patch` | Correção sem mudança de uso | Corrigir o foco de um botão; ajustar a descrição de uma opção na TUI |
| `minor` | Algo novo; enquanto a versão for 0.x, também tudo que exige ação de quem usa | Token novo; componente novo; regra de lint nova que pode acusar código existente |
| `major` | Quebra de uso, a partir da 1.0 | Renomear um token ou a prop de um componente |

Enquanto os pacotes estão em 0.x, a faixa `^0.1.0` **não** aceita `0.2.0`: um `minor` exige atualização explícita nos projetos (o Renovate abre o PR). Por isso, em 0.x, `minor` faz o papel de "quebra". Quando a API dos pacotes estabilizar, vale publicar a 1.0.

## O que já foi publicado

O fluxo rodou três vezes, e as versões saem das tags que o `changeset publish` cria.

| Data | Versões | Observação |
|---|---|---|
| 2026-10-19 | `tokens@0.1.0`, `ui@0.1.0`, `create@0.1.0`, `tsconfig@0.1.0`, `biome-config@0.1.0`, `eslint-config@0.1.0` | a primeira, sem PR de versão: não havia changeset pendente, então o release publicou a 0.1.0 direto, como estava previsto |
| 2026-10-29 | `tokens@0.2.0`, `ui@0.2.0`, `create@0.1.1` | — |
| 2026-11-05 | `tokens@0.3.0`, `ui@0.3.0`, `create@0.1.2` | Spinner, Skeleton, Pagination, Card e Modal |

O `tsconfig`, o `biome-config` e o `eslint-config` seguem na 0.1.0: não mudaram desde então.

## Configuração única (operador)

| # | Onde | O quê |
|---|---|---|
| 1 | Repositório → Settings → Actions → General (logado como `devwebdex`; colaboradores não têm acesso) | Marcar **"Allow GitHub Actions to create and approve pull requests"**. Sem isso, o workflow de release não consegue abrir o PR de versão |
| 2 | Cada dev | Token do GitHub com `read:packages` no `~/.npmrc`: `//npm.pkg.github.com/:_authToken=<token>` |
| 3 | Conta `devwebdex` → Packages → cada pacote, depois da primeira publicação | Em "Manage Actions access", dar acesso de leitura aos repositórios que vão instalar os pacotes no CI (os projetos gerados) |

O item 3 segue a documentação do GitHub Packages e **ainda não foi exercitado**. Antes da primeira publicação não dava para fazê-lo, porque os pacotes não existiam na conta; desde 2026-10-19 eles existem, então agora é acionável. Confirme no primeiro projeto que rodar CI com os pacotes publicados.

## O que já foi verificado

Os workflows foram validados com o actionlint, e cada comando deles foi executado localmente: build, lint, testes, `pnpm version-packages` com um changeset de teste e o empacotamento do `@devwebdex/create` instalado fora do monorepo. As combinações da matriz (D12) foram validadas localmente de ponta a ponta (build, tipos, lint, testes, banco, migrações, e2e e `/health`). O CI rodou pela primeira vez no GitHub Actions no PR #1, em 2026-10-15, com todos os jobs passando (inclusive o Windows).

**A publicação real no GitHub Packages funciona**, e já rodou três vezes (tabela acima). O fluxo de duas etapas — merge na `prod` abre o PR "chore: versionar pacotes", merge desse PR publica — foi exercitado de ponta a ponta.

## O que ainda não foi verificado

**Instalar os pacotes a partir do registro.** Os templates do gerador sempre foram exercitados com `--link-packages .`, que aponta para os arquivos deste checkout e **não passa pelo registro**. Ninguém ainda gerou um projeto e rodou `pnpm install` baixando `@devwebdex/ui` publicado. É o teste que fecha o ciclo, e é onde o item 3 da tabela acima apareceria como problema.

**O CI do PR de versão não roda sozinho.** O `ci.yml` dispara em todo `pull_request`, sem filtro de branch, mas o PR "chore: versionar pacotes" é aberto pelo `github-actions[bot]`, e o GitHub não executa workflow de PR aberta por bot sem aprovação manual — ele fica em `action_required`. Na prática, alguém precisa clicar em **"Approve workflows to run"** antes de mergear. Não é defeito: é a proteção do GitHub contra Action que dispara Action.
