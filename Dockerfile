# ------------------- Base -------------------
FROM node:22-alpine AS base

RUN apk add --no-cache openssl

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

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

# ARG visível apenas neste stage, não persiste na imagem final
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
ENV DATABASE_URL=${DATABASE_URL}

RUN pnpm prisma generate \
    && pnpm build

# ------------------- Production -------------------
FROM base AS prod

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY entrypoint.sh ./entrypoint.sh

# ARG visível apenas neste stage, não persiste na imagem final
ARG DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public"
ENV DATABASE_URL=${DATABASE_URL}

RUN pnpm install --frozen-lockfile --prod \
    && pnpm add prisma tsx dotenv \
    && pnpm prisma generate \
    && pnpm store prune \
    && rm -rf /tmp/* /root/.cache

RUN chmod +x entrypoint.sh

EXPOSE 3333

ENTRYPOINT ["./entrypoint.sh"]

CMD ["node", "dist/infra/main"]
