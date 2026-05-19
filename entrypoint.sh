#!/bin/sh
set -e

export PATH="/app/node_modules/.bin:$PATH"

echo "==> Gerando Prisma Client..."
npx prisma generate

echo "==> Aplicando migrations..."
npx prisma migrate deploy

echo "==> Executando seed..."
npx prisma db seed

echo "==> Criando bucket S3..."
npx tsx scripts/create-bucket.ts

echo "==> Iniciando aplicação..."
exec "$@"
