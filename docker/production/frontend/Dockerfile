FROM node:lts-alpine AS build

WORKDIR /usr/app

COPY --from=apitypes ./src ./API-Types/src
COPY --from=apitypes ./package-lock.json ./API-Types/package-lock.json
COPY --from=apitypes ./package.json ./API-Types/package.json
COPY --from=apitypes ./tsconfig.json ./API-Types/tsconfig.json

WORKDIR /usr/app/API-Types
RUN npm ci

WORKDIR /usr/app

COPY ./Frontend/package.json ./Frontend/
COPY ./Frontend/package-lock.json ./Frontend/
COPY ./Frontend/vite.config.ts ./Frontend/
COPY ./Frontend/vite.docker.config.ts ./Frontend/
COPY ./Frontend/tsconfig.json ./Frontend/
COPY ./Frontend/tsconfig.node.json ./Frontend/
COPY ./Frontend/tsconfig.app.json ./Frontend/
COPY ./Frontend/index.html ./Frontend/
COPY ./Frontend/.eslintrc.cjs ./Frontend/
COPY ./Frontend/src ./Frontend/src
COPY ./Frontend/public ./Frontend/public

WORKDIR /usr/app/Frontend

RUN npm ci
#RUN NODE_ENV=development vite build --mode development --config vite.config.ts

EXPOSE 5173

CMD ["npm", "run", "docker:dev:dev"]
#CMD ["npm", "run", "dev"]
#CMD ["npm", "exec", "vite", "--config", "vite.docker.config.ts"]