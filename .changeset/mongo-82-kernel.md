---
"@devwebdex/create": patch
---

Projetos com MongoDB passam a usar a imagem `mongo:8.2` em vez de `mongo:8`. A `mongo:8` agora traz a 8.3, que recusa iniciar em Linux com kernel 6.19 ou mais novo (SERVER-121912), como o dos runners do GitHub Actions e de distribuições recentes. Projetos já gerados: troque `image: mongo:8` por `image: mongo:8.2` no `docker-compose.yml`.
