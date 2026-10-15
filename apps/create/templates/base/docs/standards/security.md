# Padrão de segurança

Regras mínimas para todo código do projeto. Baseado no OWASP Top 10. O subagente `security` revisa contra este documento.

## Entrada de dados

- Toda entrada externa (body, query, params, headers, arquivos) é validada no limite do sistema antes de chegar à regra de negócio.
- Validação por lista do que é permitido; campos desconhecidos são descartados ou rejeitados.
- Nunca confie em IDs vindos do cliente para decidir permissão: confira se o recurso pertence ao usuário autenticado.

## Banco de dados

- Consultas só pela API do ORM ou por SQL parametrizado (template tag do Prisma: `` $queryRaw`... ${valor}` ``).
- **Proibido** montar SQL com concatenação ou usar `$queryRawUnsafe` / `$executeRawUnsafe` com valor vindo de fora.

## Autenticação e autorização

- Toda rota é protegida por padrão; rota pública é exceção explícita e justificada.
- Autorização checada no servidor, em cada operação, não só na interface.
- Senhas com algoritmo de hash próprio para senha (argon2id ou bcrypt), nunca hash rápido (MD5, SHA).
- Tokens e sessões com expiração; cookies de sessão com `HttpOnly`, `Secure` e `SameSite`.

## Segredos e configuração

- Segredos só em variáveis de ambiente; nunca no código, em logs ou em mensagens de erro.
- No Next, só variáveis `NEXT_PUBLIC_*` chegam ao navegador: nunca coloque segredo nelas.
- A aplicação falha na inicialização se uma variável obrigatória estiver ausente.
- Serviços do `docker-compose.yml` de desenvolvimento publicam portas só em `127.0.0.1`: as senhas ali são de desenvolvimento e o Docker ignora o firewall do host.

## Erros e logs

- Resposta de erro ao cliente não expõe stack trace, SQL nem detalhes internos.
- Logs não registram senha, token, documento pessoal nem dado de cartão.

## Dependências

- Dependência nova precisa de justificativa; prefira o que já existe no projeto.
- Versões fixadas pelo lockfile; atualizações chegam por PR do Renovate (`.github/renovate.json`) e passam pelo CI.
- Os pacotes `@devwebdex/*` vêm num PR só. Em 0.x, um `minor` muda a faixa (`^0.1.0` → `^0.2.0`) e pode quebrar: revise antes de aceitar.
- O Renovate lê os `@devwebdex/*` no GitHub Packages com o segredo `DEVWEBDEX_PACKAGES_TOKEN`: um token clássico com `read:packages`, cadastrado em developer.mend.io, nas Credentials da conta ou organização dona do repositório. Nunca coloque o token no repositório.

## Navegador

- CORS restrito às origens conhecidas, nunca `*` em rota autenticada.
- Nada de `dangerouslySetInnerHTML` com conteúdo vindo do usuário.
