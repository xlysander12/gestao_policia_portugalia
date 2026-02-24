FROM node:lts-alpine AS build

WORKDIR /usr/app

COPY --from=apitypes ./src ./API-Types/src
COPY --from=apitypes ./package-lock.json ./API-Types/package-lock.json
COPY --from=apitypes ./package.json ./API-Types/package.json
COPY --from=apitypes ./tsconfig.json ./API-Types/tsconfig.json

WORKDIR /usr/app/API-Types
RUN npm ci

WORKDIR /usr/app

COPY ./Backend/package.json ./Backend/
COPY ./Backend/package-lock.json ./Backend/
COPY ./Backend/tsconfig.json ./Backend/
COPY ./Backend/tsconfig.prod.json ./Backend/
COPY ./Backend/ecosystem.config.js ./Backend/
COPY ./Backend/eslint.config.js ./Backend/
COPY ./Backend/jest.config.js ./Backend/
COPY ./Backend/knexfile.ts ./Backend/
COPY ./Backend/nodemon.json ./Backend/
COPY ./Backend/migrations ./Backend/migrations
COPY ./Backend/seeds ./Backend/seeds
COPY ./Backend/scripts ./Backend/scripts
COPY ./Backend/src ./Backend/src
COPY ./Backend/tests ./Backend/tests

WORKDIR /usr/app/Backend
RUN npm ci

ARG NODE_ENV=production
RUN npm run build

WORKDIR /usr/app/Backend/dist

FROM node:lts-alpine AS backendserve

WORKDIR /usr/app
RUN mkdir -p /usr/app/Backend

COPY --from=build /usr/app/API-Types ./API-Types
COPY --from=build /usr/app/Backend/package.json ./Backend
COPY --from=build /usr/app/Backend/package-lock.json ./Backend
COPY --from=build /usr/app/Backend/tsconfig.json ./Backend
COPY --from=build /usr/app/Backend/tsconfig.prod.json ./Backend
COPY --from=build /usr/app/Backend/ecosystem.config.js ./Backend
COPY --from=build /usr/app/Backend/eslint.config.js ./Backend
COPY --from=build /usr/app/Backend/jest.config.js ./Backend
COPY --from=build /usr/app/Backend/knexfile.ts ./Backend
COPY --from=build /usr/app/Backend/nodemon.json ./Backend
COPY --from=build /usr/app/Backend/dist ./Backend/dist
COPY --from=build /usr/app/Backend/node_modules ./Backend/node_modules
COPY --from=build /usr/app/Backend/migrations ./Backend/migrations
COPY --from=build /usr/app/Backend/seeds ./Backend/seeds
COPY --from=build /usr/app/Backend/scripts ./Backend/scripts
COPY --from=build /usr/app/Backend/src ./Backend/src
COPY --from=build /usr/app/Backend/tests ./Backend/tests
COPY ./Backend/config.json* ./Backend/config.json
COPY ./scripts/entrypoint.sh ./entrypoint.sh

RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -G nodejs -u 1001

RUN chmod +x ./entrypoint.sh
RUN mkdir -p /usr/app/Backend/logs && chown -R 1001:1001 /usr/app/Backend/logs
RUN chown 1001:1001 ./entrypoint.sh

USER backend

ARG NODE_ENV=production
ENTRYPOINT [ "./entrypoint.sh" ]
