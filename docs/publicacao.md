# Publicação dos pacotes `@devwebdex/*`

Publicar é enviar uma versão numerada de cada pacote (`@devwebdex/ui@0.2.0`, por exemplo) para o GitHub Packages da conta `devwebdex` ("WEbdEX - Development"), de forma privada. `devwebdex` é uma **conta de usuário**, não uma organização do GitHub: as configurações do repositório e dos pacotes exigem o login dessa conta. Depois disso, qualquer projeto instala o pacote e o gerador roda com `bunx @devwebdex/create`. **Versão publicada é imutável**: uma correção sai como versão nova, nunca sobrescreve a anterior.

Decisões (operador, 2026-10-14): versões **independentes** por pacote e publicação **só por PR de release aprovado**.

## Fluxo do dia a dia

1. **No PR que altera um pacote**, rode `pnpm changeset` e responda:
   - quais pacotes mudaram;
   - o tipo de cada mudança (tabela abaixo);
   - um resumo de uma linha, que vai para o CHANGELOG.

   Isso cria um arquivo em `.changeset/`. Commite junto com a mudança.
2. **O CI** (`.github/workflows/ci.yml`) roda lint, tipos e testes, e gera 17 combinações de projeto com os pacotes do PR (build, tipos, lint, testes e, com backend, banco, migrações e testes e2e).
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

## Primeira publicação

Os pacotes estão em `0.1.0` e nunca foram publicados. No primeiro merge na `prod` com estes workflows, não há changeset pendente, então o release **publica a 0.1.0 de todos os pacotes direto**, sem PR de versão: o próprio PR que traz os workflows é a aprovação dessa primeira publicação.

## Configuração única (operador)

| # | Onde | O quê |
|---|---|---|
| 1 | Repositório → Settings → Actions → General (logado como `devwebdex`; colaboradores não têm acesso) | Marcar **"Allow GitHub Actions to create and approve pull requests"**. Sem isso, o workflow de release não consegue abrir o PR de versão |
| 2 | Cada dev | Token do GitHub com `read:packages` no `~/.npmrc`: `//npm.pkg.github.com/:_authToken=<token>` |
| 3 | Conta `devwebdex` → Packages → cada pacote, depois da primeira publicação | Em "Manage Actions access", dar acesso de leitura aos repositórios que vão instalar os pacotes no CI (os projetos gerados) |

O item 3 segue a documentação do GitHub Packages e ainda não foi exercitado: confirme no primeiro projeto que rodar CI com os pacotes publicados.

## O que não foi verificado

Os workflows foram validados com o actionlint, e cada comando deles foi executado localmente: build, lint, testes, `pnpm version-packages` com um changeset de teste e o empacotamento do `@devwebdex/create` instalado fora do monorepo. Das 17 combinações da matriz (D12), foram validadas localmente, de ponta a ponta (build, tipos, lint, testes, banco, migrações, e2e e `/health`), combinações que cobrem todas as camadas. **Os workflows ainda não rodaram no GitHub Actions, porque nada foi enviado como PR para a `prod`; a publicação real no GitHub Packages também só acontece depois disso** (CI no PR; publicação no merge na `prod`).
