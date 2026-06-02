# Portal Segurança

Sistema completo para gestão operacional das forças policiais (PSP/GNR), com backend em Node.js/TypeScript, frontend em React + Vite e base de dados MySQL/MariaDB.

## Estrutura do repositório

- `Backend/` — API, autenticação, integração com Discord/GitHub/Google Sheets e entrega da app em produção.
- `Frontend/` — interface web React.
- `API-Types/` — tipos partilhados entre backend e frontend.
- `Database/` — estrutura SQL, backups e ambiente local com Docker Compose.
- `deploy.sh` — script de build do backend e frontend.

## Pré-requisitos

- Node.js 20+ (recomendado)
- npm 10+
- MariaDB/MySQL
- Docker + Docker Compose (opcional, para base de dados local)

## Setup rápido

1. Instalar dependências:
   - `cd API-Types && npm ci`
   - `cd ../Backend && npm ci`
   - `cd ../Frontend && npm ci`
2. Configurar backend:
   - Criar `Backend/.env` (ver `Backend/README.md`)
   - Rever `Backend/config.json` (é gerado a partir de `src/assets/config.sample.json`)
   - Garantir os ficheiros `Backend/src/assets/google-creds.json` e `Backend/src/assets/github-issues-app.pem`
3. Configurar base de dados:
   - Opção local com Docker: `cd Database/Local\ Server && docker compose up -d`
4. Build:
   - `cd Backend && npm run build`
   - `cd ../Frontend && npm run build`

## Build único com script

Também pode usar:

```bash
cd gestao_policia_portugalia
./deploy.sh -skip
```

Flags adicionais: `-update`, `-migrate`, `-start`, `-restart`.

## Documentação por módulo

- Backend: `Backend/README.md`
- Frontend: `Frontend/README.md`
