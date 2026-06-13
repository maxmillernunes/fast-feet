#!/bin/sh
set -e

export PATH="/app/node_modules/.bin:$PATH"

echo "==> Aplicando migrations..."
prisma migrate deploy

echo "==> Executando seed..."
prisma db seed

echo "==> Criando bucket S3..."
tsx scripts/create-bucket.ts

echo "==> Iniciando aplicação..."
exec "$@"
