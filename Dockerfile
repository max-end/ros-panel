FROM node:24-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY pnpm-workspace.yaml package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN pnpm install --frozen-lockfile=false

COPY . .

RUN pnpm approve-builds --all || true
RUN pnpm build

FROM node:24-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

ENV NODE_ENV=production
ENV PORT=3001

COPY pnpm-workspace.yaml package.json ./
COPY server/package.json ./server/
COPY client/package.json ./client/

RUN pnpm install --prod --frozen-lockfile=false

COPY --from=builder /app/server/dist ./server/dist
COPY --from=builder /app/client/dist ./client/dist

EXPOSE 3001

CMD ["node", "server/dist/index.js"]
