import { PrismaClient } from '../src/infra/database/prisma/client/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcrypt'

const prisma = new PrismaClient({
  adapter: new PrismaPg(
    {
      connectionString: process.env.DATABASE_URL!,
    },
    {
      schema: process.env.DATABASE_SCHEMA,
    },
  ),
})

async function main() {
  const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } })

  if (existing) {
    console.log('Admin já existe, pulando seed.')
    return
  }

  const passwordHash = await hash('123456', 8)

  await prisma.user.create({
    data: {
      name: 'Admin FastFeet',
      document: '12345678901',
      email: 'admin@fastfeet.com',
      password: passwordHash,
      role: 'ADMIN',
    },
  })

  console.log('Admin criado: admin@fastfeet.com / 123456')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => await prisma.$disconnect())
