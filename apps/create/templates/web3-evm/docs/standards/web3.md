# Padrão de web3 (EVM)

Regras para todo código que fala com blockchain neste projeto. Complementa [security.md](security.md) e, quando há backend, o padrão de monólito modular. O subagente `web3` revisa contra este documento.

## Escolhas

- Só EVM. Produção na Polygon (`polygon`, chainId 137); desenvolvimento e testes na Polygon Amoy (`polygonAmoy`, chainId 80002). As duas vêm de `viem/chains`.
- viem no backend e no frontend (no frontend, por meio do wagmi). ethers.js só em projeto legado que já o usa; nunca as duas bibliotecas no mesmo projeto.
- A rede ativa vem de variável de ambiente e é resolvida num único arquivo de configuração em cada app. Nenhum outro arquivo escreve `137` ou `80002` nem importa a chain direto.
- RPC de provedor contratado, com a URL em variável de ambiente. RPC público tem limite de taxa e não serve para produção. A URL do frontend é pública: use uma chave separada da do backend e restrinja-a por domínio no painel do provedor, quando ele oferecer.

## Onde fica cada coisa

- Cliente da rede da API (`createPublicClient`): infraestrutura compartilhada, fora dos módulos (`src/shared/` no Express, Fastify e Nest; `app/shared/` no AdonisJS). Um cliente por processo, criado na inicialização com a chain e o RPC da configuração.
- ABI: no módulo dono do contrato, declarada `as const`. Sem o `as const`, o TypeScript não infere argumentos nem retorno de `readContract`.
- Endereços de contrato: por rede, na configuração, ao lado da escolha da rede. Nunca espalhados em módulos ou componentes.
- A interação com um contrato pertence ao módulo de domínio dono dele (ex.: `membership` lê o NFT de acesso). Outro módulo que precise do dado chama o serviço exportado por esse módulo, como em qualquer fronteira do monólito modular.

## Carteira no frontend (wagmi)

- Conectores: `injected()` e `walletConnect({ projectId })`. Com `multiInjectedProviderDiscovery` (padrão `true` no `createConfig`), o wagmi descobre por EIP-6963 cada carteira instalada no navegador e cria um conector injetado para cada uma. O `walletConnect` cobre carteiras de celular.
- Nunca assuma MetaMask: nada de `window.ethereum` direto nem de conector exclusivo da MetaMask. A interface lista as carteiras encontradas.
- O `projectId` do Reown (WalletConnect) fica em variável pública do frontend (`NEXT_PUBLIC_*` no Next, `VITE_*` no Vite). Ele é público, mas cadastre a allowlist de origens no painel do Reown: com a lista vazia, qualquer origem usa o projeto.
- `chains` do `createConfig` contém só a rede do ambiente. Se a carteira estiver em outra rede, peça a troca (`useSwitchChain`) e bloqueie a ação até o usuário trocar. Nunca peça assinatura ou transação na rede errada.

## Login com SIWE (EIP-4361)

1. O frontend pede um nonce à API. A API gera o nonce com `randomBytes` de `node:crypto` (ex.: 16 bytes em hex), guarda no servidor com validade curta (ex.: 5 minutos) e devolve. Não use `generateSiweNonce` do viem para isso: ele usa `Math.random`, que não é criptograficamente seguro.
2. O frontend monta a mensagem com `createSiweMessage` (`viem/siwe`): `domain` (host do app), `uri`, `chainId` da rede ativa, `nonce`, `issuedAt`, `expirationTime` (poucos minutos) e `version: '1'`. O usuário assina na carteira.
3. A API valida o corpo (`message`, `signature`) no limite, lê os campos com `parseSiweMessage` e consome o nonce: apaga do armazenamento de forma atômica e só segue se ele existia e não tinha expirado. Também confere que `chainId` é a rede ativa, `uri` é a esperada e `expirationTime` está presente e próximo.
4. A API verifica com `publicClient.verifySiweMessage({ message, signature, domain, nonce })`. Ela confere domínio e nonce só quando recebe esses parâmetros, confere `expirationTime` e `notBefore` contra a hora atual e valida a assinatura, inclusive de carteira de contrato (EIP-1271 e EIP-6492, por chamada à rede do cliente). Não confere `chainId` nem `uri`: por isso o passo 3.
5. Assinatura válida: a API emite a sessão do projeto, com expiração e nas regras de `security.md`, guardando o endereço normalizado por `getAddress`. A sessão é do projeto; a assinatura SIWE não é reaproveitada.

```ts
import { getAddress } from 'viem'
import { parseSiweMessage } from 'viem/siwe'

const fields = parseSiweMessage(message)
const nonce = await nonces.consume(fields.nonce) // apaga e devolve; undefined se não existe ou expirou
if (!nonce || fields.chainId !== chain.id || !fields.expirationTime || !fields.address) throw unauthorized()

const valid = await publicClient.verifySiweMessage({ message, signature, domain: appDomain, nonce })
if (!valid) throw unauthorized()
const address = getAddress(fields.address)
```

## Controle de acesso por contrato

- Quem decide acesso é o backend, lendo o contrato com `readContract`: papel on-chain (`hasRole(role, address)` do AccessControl da OpenZeppelin) ou posse de token (`balanceOf(address)` de ERC-20 ou ERC-721).
- O endereço consultado é o da sessão. Nunca use endereço, papel ou saldo enviado pelo cliente.
- Leia a cada decisão ou com cache curto, com chave por rede, contrato e endereço. Uma revogação on-chain leva até o TTL do cache para valer: escolha o TTL pensando nisso.
- RPC falhou: negue o acesso. Não estenda o cache além do TTL.
- O frontend lê o mesmo dado só para mostrar ou esconder interface; ele nunca decide acesso.
- Decisão sensível (liberar valor, operação administrativa, reagir a um pagamento): não confie em bloco recente, que pode ser reorganizado e estar em alturas diferentes em RPCs diferentes. Leia com `blockTag: 'finalized'` ou espere confirmações (`waitForTransactionReceipt` com `confirmations`).

## Transações

- O usuário assina na própria carteira, no frontend. O backend nunca recebe, gera nem guarda chave ou seed de usuário.
- Backend com carteira própria (relayer, operação administrativa): a chave fica num gerenciador de segredos, uma por ambiente, com o saldo mínimo para operar e só os papéis de contrato de que precisa. Essa mudança exige revisão do subagente `security` antes do merge.

## Valores

- Valor on-chain é sempre `bigint`, nunca `number` (perde precisão acima de 2^53).
- Conversão só com `parseUnits(texto, decimais)` e `formatUnits(valor, decimais)`, usando os `decimals` do token (ex.: USDC tem 6, POL tem 18). Os decimais vêm do contrato ou da configuração, junto do endereço.
- JSON não serializa `bigint`: na API, o valor trafega como string decimal e é convertido na borda.

## Segurança

- Chave privada e seed nunca no repositório, no frontend, em variável pública nem em log.
- Dado vindo da blockchain (retorno de contrato, evento, metadado de token) é entrada não confiável: valide antes de usar e nunca renderize como HTML.
- Endereço vindo de fora: valide com `isAddress(valor, { strict: false })` e normalize com `getAddress` antes de guardar ou comparar.
- Confira o `chainId` em toda assinatura e em toda operação que dependa da rede.

## Testes

- Unitários: o serviço recebe um cliente falso (objeto com `readContract`, `verifySiweMessage` etc. controlados pelo teste). Sem rede.
- Integração: na Amoy, com contratos e carteiras de teste. A chave da carteira de teste é segredo do CI e a carteira não tem fundos na mainnet.
- Nenhum teste automatizado contra a mainnet.
//#if backend!=none

## Login gerado com o projeto

O gerador entrega o login SIWE pronto, com a sessão escolhida na criação do projeto (`.webdex/manifest.json`, campo `session`). Todos os backends seguem o mesmo contrato, e o frontend gerado já o consome.

Com o login, toda rota exige sessão por padrão (`security.md`). As exceções são explícitas e ficam numa lista visível no código: `GET /health`, `GET /auth/nonce` e `POST /auth/verify` (e, com Inertia, as páginas públicas). Rota nova sem sessão entra nessa lista de propósito, nunca por esquecimento.

### Rotas

| Rota | Entrada | Resposta |
|---|---|---|
| `GET /auth/nonce` | nada | `200 { "nonce": "<32 hex>" }`; nonce de `randomBytes(16)`, guardado com validade de 5 minutos |
| `POST /auth/verify` | `{ "message": string, "signature": "0x..." }` | sessão criada (ver Transporte). `400` corpo inválido ou grande demais; `401` nonce, domínio, URI, rede, validade ou assinatura inválidos |
| `GET /auth/me` | sessão | `200 { "address": "0x..." }` (endereço com checksum) ou `401` |
| `POST /auth/logout` | sessão | `204`; a sessão é apagada no servidor |
| `GET /access/admin` | sessão | `200 { "address": "0x...", "role": "admin" }` se o endereço tem `ADMIN_ROLE` no contrato de `ACCESS_CONTROL_ADDRESS`; `403` se não tem, se a variável está vazia ou se o RPC falha; `401` sem sessão |

`/access/admin` é o exemplo de acesso por contrato: `hasRole(ADMIN_ROLE, address)` do AccessControl da OpenZeppelin, com `ADMIN_ROLE = keccak256("ADMIN_ROLE")`. Copie o padrão para os papéis do projeto.

### Verificação em `POST /auth/verify`, nesta ordem

1. Corpo validado antes de qualquer leitura: `message` texto com no máximo 4096 caracteres e `signature` hex (`0x` + dígitos) com no máximo 16384. O `parseSiweMessage` do viem tem custo quadrático no tamanho da mensagem (100 KB levam cerca de 2 s): sem o limite, uma única requisição trava a API.
2. `parseSiweMessage(message)` e consumo atômico do nonce: apaga e só segue se ele existia e não tinha expirado.
3. `domain` igual ao host de `SIWE_ORIGIN`, `uri` com origem igual a `SIWE_ORIGIN` (comparar o começo do texto aceitaria `https://app.com.evil`), `chainId` igual ao da rede ativa e `expirationTime` presente e no máximo 10 minutos à frente.
4. `publicClient.verifySiweMessage({ message, signature, domain, nonce })`.
5. Sessão criada: token de `randomBytes(32)` em base64url; o servidor guarda só o SHA-256 do token, com o endereço (`getAddress`) e validade de 24 horas.

### Transporte da sessão

//#if session=cookie
- Cookie `HttpOnly`, `SameSite=Lax`, `Path=/` e `Max-Age=86400`, sem `Domain`. Com `SIWE_ORIGIN` em https, o cookie é `Secure` e se chama `__Host-session`: o prefixo impede que um subdomínio grave um cookie com o mesmo nome e fixe a sessão de outra pessoa. Em http (desenvolvimento), chama-se `session`. `POST /auth/verify` responde `204` com o cookie; `POST /auth/logout` o apaga.
- CSRF: toda requisição que muda estado (`POST`, `PUT`, `PATCH`, `DELETE`) precisa do cabeçalho `Origin` igual a `SIWE_ORIGIN`, senão `403`. O CORS libera só `CORS_ORIGINS`, com `credentials`.
- O frontend chama a API com `credentials: 'include'`. Frontend e API ficam no mesmo site (ex.: `app.exemplo.com` e `api.exemplo.com`).
//#endif
//#if session=token
- Token de acesso: `POST /auth/verify` responde `200 { "token": "...", "expiresAt": "<ISO 8601>" }`. As rotas com sessão leem `Authorization: Bearer <token>`.
- O frontend guarda o token só em memória: some ao recarregar a página, e o usuário assina de novo. Não use `localStorage`, que um XSS leria.
//#endif
//#if session=jwt
- JWT: `POST /auth/verify` responde `200 { "token": "<JWT>", "expiresAt": "<ISO 8601>" }`. As rotas com sessão leem `Authorization: Bearer <JWT>`.
- O JWT é assinado com HS256 e `JWT_SECRET` (o `.env.example` traz a variável vazia e o `pnpm env:setup` gera um valor aleatório no `.env`). Claims: `sub` (endereço com checksum), `iat`, `exp` (1 hora), `iss` e `aud` (os dois iguais a `SIWE_ORIGIN`). A verificação fixa o algoritmo em HS256 (recusa `none` e qualquer outro) e confere assinatura, `exp`, `iss` e `aud`.
- Nada fica no banco: nenhuma rota consulta `auth_sessions`. Por isso o JWT não é revogável: `POST /auth/logout` responde `204` e o frontend descarta o token, mas o mesmo JWT continua válido até expirar. Se o projeto precisar revogar na hora (ex.: conta comprometida), use `token` ou `cookie`, ou troque `JWT_SECRET`, o que derruba todas as sessões.
- O frontend guarda o JWT só em memória, como o token. Não use `localStorage`, que um XSS leria.
//#endif

### Armazenamento

- `auth_nonces`: `nonce` (chave) e `expires_at`.
- `auth_sessions`: `id` (SHA-256 do token, chave), `address`, `expires_at` e `created_at`. Com JWT, a tabela existe mas não é usada.
- Linhas expiradas não valem; a limpeza periódica fica a critério do projeto.

### Variáveis de ambiente da API

- `CHAIN`: `polygonAmoy` (desenvolvimento) ou `polygon` (produção).
- `RPC_URL`: o `.env.example` traz o RPC público da Amoy, só para desenvolvimento.
- `SIWE_ORIGIN`: origem do frontend que pede a assinatura (ex.: `http://localhost:3000`).
- `ACCESS_CONTROL_ADDRESS`: contrato com os papéis; vazio nega `/access/admin`.
//#if session=jwt
- `JWT_SECRET`: segredo do HS256, com pelo menos 32 bytes; gerado no `.env` pelo `pnpm env:setup`.
//#endif

### Testes gerados

- Unitários com cliente da rede falso.
- e2e com o banco real: uma conta local (`privateKeyToAccount(generatePrivateKey())`) assina a mensagem, e um cliente da rede de teste verifica a assinatura sem RPC (`recoverMessageAddress`). Cobrem login, `me`, logout, nonce reutilizado, domínio errado, com cookie `Origin` inválido e, com JWT, token expirado, assinatura adulterada e `alg: none`.
//#endif
