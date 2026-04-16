import { BadRequestException, Body, Controller, Post } from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { hash } from 'bcrypt'

const createAccountBodySchema = z.object({
  name: z.string(),
  document: z
    .string()
    .transform((v) => v.replace(/\D/g, '')) // Remove caracteres não numéricos
    .refine((v) => v.length === 11, 'Document deve ter 11 dígitos')
    .refine(
      (v) => !/^(.)\1{10}$/.test(v),
      'Document inválido (dígitos repetidos)',
    )
    .refine((v) => {
      // Algoritmo to validate the Document (módulo 11)
      for (let t = 9; t < 11; t++) {
        let sum = 0
        for (let c = 0; c < t; c++) {
          sum += Number(v[c]) * (t + 1 - c)
        }
        if (Number(v[t]) !== ((10 * sum) % 11) % 10) return false
      }
      return true
    }, 'Document inválido'),
  password: z.string(),
})

const bodyValidationSchema = new ZodValidationPipe(createAccountBodySchema)

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/accounts')
export class CreateAccountController {
  constructor(private prisma: PrismaService) {}

  @Post()
  async handle(@Body(bodyValidationSchema) body: CreateAccountBodySchema) {
    const { name, document, password } = body

    const existingUser = await this.prisma.user.findFirst({
      where: { document },
    })

    if (existingUser) {
      throw new BadRequestException('User with this document already exists')
    }

    const passwordHash = await hash(password, 10)

    await this.prisma.user.create({
      data: {
        name,
        document,
        password: passwordHash,
      },
    })
  }
}
