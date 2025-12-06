FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/*/package.json ./packages/*/
COPY turbo.json ./

RUN npm ci --legacy-peer-deps --workspaces

COPY apps/api ./apps/api
COPY packages ./packages

WORKDIR /app/apps/api

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]

