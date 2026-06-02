# Backend - Portal Segurança

API e servidor principal do Portal Segurança, responsável por autenticação, regras de negócio, integração com serviços externos e entrega de ficheiros estáticos em produção.

## Stack

- Node.js + TypeScript
- Express + Socket.IO
- Knex + MySQL/MariaDB
- PM2 (produção)

## Pré-requisitos

- Node.js 20+
- npm 10+
- Base de dados MySQL/MariaDB acessível

## Configuração

### 1) Dependências

```bash
cd /tmp/workspace/xlysander12/gestao_policia_portugalia/API-Types && npm ci
cd /tmp/workspace/xlysander12/gestao_policia_portugalia/Backend && npm ci
```

### 2) Variáveis de ambiente

Criar `/tmp/workspace/xlysander12/gestao_policia_portugalia/Backend/.env` com:

- `HTTP_PORT`
- `GH_APP_ID`
- `GH_APP_INSTALLATION_ID`
- `GH_REPO_OWNER`
- `GH_REPO_NAME`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `SESSION_SECRET`
- `PS_IS_PRODUCTION` (opcional, afeta detalhes de erro e cookies seguros)
- `LOG_LEVEL` (opcional, default: `info`)

### 3) Ficheiros obrigatórios em `src/assets`

- `google-creds.json`
- `github-issues-app.pem`

### 4) Configuração estática

Ao arrancar, o backend valida/cria `config.json` na raiz de `Backend/`, com base em `src/assets/config.sample.json`.

## Scripts disponíveis

- `npm run dev` — desenvolvimento com nodemon
- `npm run build` — build completo (inclui API-Types, compile e cópia de assets)
- `npm run start` — inicia com PM2
- `npm run restart` — reinicia app PM2
- `npm run migrate` — aplica migrations
- `npm run rollback` — rollback de migration
- `npm run test-migrate` — migration de teste com ambiente `test`

> Nota: `npm run test` usa `jest --watch`.

## Rotas e entrega de conteúdo

Com o prefixo base `/portugalia/portalseguranca`, o servidor expõe:

- `/api` — endpoints da aplicação
- `/ws` — websocket (Socket.IO)
- `/manual` — manual do utilizador (PDF)
- `/titles` — assets de títulos
- `/db` — ficheiros da pasta `Database` (protegido por sessão/permissões)

Além disso, em produção serve o build do frontend de `../Frontend/dist`.
