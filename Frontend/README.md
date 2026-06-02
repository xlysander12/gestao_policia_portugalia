# Frontend - Portal Segurança

Aplicação web do Portal Segurança, construída com React + TypeScript + Vite.

## Stack

- React 18
- TypeScript
- Vite
- Material UI
- Socket.IO Client

## Pré-requisitos

- Node.js 20+
- npm 10+
- Backend em execução para funcionalidades completas

## Instalação

Executar a partir da raiz do repositório:

```bash
cd API-Types && npm ci
cd ../Frontend && npm ci
```

## Scripts

- `npm run dev` — arranca o frontend em desenvolvimento
- `npm run build` — build de produção
- `npm run preview` — pré-visualização local do build
- `npm run lint` — lint com ESLint

## Endpoints base usados pela app

Definidos em `src/utils/constants.ts`:

- `BASE_URL`: `/portugalia/portalseguranca`
- `BASE_API_URL`: `/portugalia/portalseguranca/api`
- `BASE_WS_URL`: `/portugalia/portalseguranca/ws`

Durante desenvolvimento, o Vite usa proxy para `http://localhost:8080` (API/manual/titles/ws).
Se necessário, alinhe este valor com `HTTP_PORT` definido no backend.

## Estrutura principal

- `src/pages/` — páginas da aplicação
- `src/components/` — componentes reutilizáveis
- `src/hooks/` — hooks React
- `src/utils/` — utilitários, constantes e camada de requests

## Notas

- O frontend depende de tipos do pacote local `@portalseguranca/api-types`.
- Em produção, o backend serve o build gerado em `Frontend/dist`.
