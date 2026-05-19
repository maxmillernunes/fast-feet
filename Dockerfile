# ------------------- Base Stage -------------------
FROM node:22-alpine AS base

RUN apk add --no-cache openssl

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml ./

# ------------------- Dependencies -------------------
FROM base AS deps
RUN pnpm install --frozen-lockfile

# ------------------- Builder -------------------
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY tsconfig*.json ./
COPY prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN pnpm prisma generate
RUN pnpm build

# ------------------- Development -------------------
FROM base AS dev

ENV NODE_ENV=development

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN pnpm prisma generate 
RUN chmod +x entrypoint.sh

EXPOSE 3333

ENTRYPOINT ["sh", "./entrypoint.sh"]

CMD ["pnpm", "start:dev"]

# ------------------- Production -------------------
FROM node:22-alpine AS prod

RUN apk add --no-cache openssl
RUN corepack enable 
RUN corepack prepare pnpm@latest --activate

WORKDIR /app
ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY scripts ./scripts
COPY entrypoint.sh ./entrypoint.sh

RUN pnpm install --frozen-lockfile --prod
RUN pnpm add prisma tsx dotenv
RUN pnpm prisma generate
RUN pnpm store prune
RUN chmod +x entrypoint.sh
RUN rm -rf /tmp/* /root/.cache

EXPOSE 3333

ENTRYPOINT ["./entrypoint.sh"]

CMD ["node", "dist/infra/main"]
