# Filas: BullMQ + Redis

Trabalho demorado ou sujeito a falha (e-mail, integração externa, relatório) sai do request HTTP e vai para uma fila. A API enfileira e responde; o worker, um processo separado, processa. Um worker que cai ou reinicia não derruba a API, e cada um escala por conta própria.

## Como roda

- Redis 8 no `docker-compose.yml`, porta só em `127.0.0.1` e sem senha (desenvolvimento). A API lê `REDIS_URL` de `apps/api/.env`.
- `pnpm dev` sobe a API; `pnpm dev:worker`, em outro terminal, sobe o worker.
- Produção: `pnpm --filter api worker` roda o worker a partir do build.
- `GET /health` confere o banco e o Redis.

## Onde fica cada parte

O projeto nasce com a fila de exemplo `mail` (job `send-mail`). O processador só registra o assunto no log: troque pelo provedor de e-mail do projeto.

| Parte | Express / Fastify | NestJS | AdonisJS |
| --- | --- | --- | --- |
| Nome da fila e tipo do job | `src/modules/mail/mail.queue.ts` | `src/modules/mail/mail.queue.ts` | `app/modules/mail/mail_job.ts` |
| Produtor (enfileira) | `createMailQueue(redis.connection)` | `MailService.send()` (importe o `MailModule`) | `MailService.send()` (injete com `@inject()`) |
| Processador | `src/modules/mail/mail.processor.ts` | `MailProcessor` em `mail.processor.ts` | `app/modules/mail/mail_processor.ts` |
| Entrada do worker | `src/worker.ts` | `src/worker.ts` + `WorkerModule` | `commands/queue_work.ts` (`node ace queue:work`) |
| Teste com Redis real | `test/mail.e2e-spec.ts` | `test/mail.e2e-spec.ts` | `tests/functional/mail_service.spec.ts` |

## Regras

- **A fila pertence a um módulo.** Nome da fila e tipo do job ficam no módulo dono e saem pela API pública dele. Outro módulo enfileira por essa API, nunca abrindo uma `Queue` com o nome da fila alheia.
- **Processador só no worker.** A API nunca registra `Worker`; no Nest, o processador fica num módulo que só o `WorkerModule` importa.
- **Job pequeno e serializável.** Mande ids e dados simples, nunca segredos nem objetos inteiros do banco; o worker busca o resto.
- **Processador idempotente.** O BullMQ entrega pelo menos uma vez: depois de uma queda, o mesmo job pode rodar de novo.
- **Retentativa explícita.** Use `attempts` e `backoff` no `add()` (ou em `defaultJobOptions` da fila) quando a falha for transitória.
- **Fila nova:** crie no módulo dono (nome, tipo do job, produtor e processador), registre o processador no worker e cubra com um teste que enfileira e espera o job terminar.
- **Redis de produção:** com senha e TLS (`rediss://`) e `maxmemory-policy noeviction`, que o BullMQ exige para não perder jobs.
