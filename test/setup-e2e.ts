import 'dotenv/config'
import { PrismaClient } from '@/infra/database/prisma/client/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { execSync } from 'child_process'
import { randomUUID } from 'crypto'
import { afterAll, beforeAll } from 'vitest'

const schemaId = randomUUID()
let prisma: PrismaClient

beforeAll(async () => {
  const url = new URL(process.env.DATABASE_URL!)

  url.searchParams.set('schema', schemaId)

  const databaseURL = url.toString()

  process.env.DATABASE_URL = databaseURL
  process.env.DATABASE_SCHEMA = schemaId

  prisma = new PrismaClient({
    adapter: new PrismaPg(
      { connectionString: databaseURL },
      { schema: schemaId },
    ),
  })

  execSync('pnpm prisma migrate deploy')
})

afterAll(async () => {
  await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaId}" CASCADE`)
  await prisma.$disconnect()
})
