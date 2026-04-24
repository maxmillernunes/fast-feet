import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { CreateAccountUseCase } from '@/domain/iam/application/use-cases/create-account'
import { UserRole } from '@/domain/iam/enterprise/entities/user'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'

const createAccountBodySchema = z.object({
  name: z.string(),
  email: z.email(),
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
  role: z.enum(UserRole),
})

const bodyValidationSchema = new ZodValidationPipe(createAccountBodySchema)

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/accounts')
@UseGuards(JwtAuthGuard)
export class CreateAccountController {
  constructor(private createAccount: CreateAccountUseCase) {}

  @Post()
  async handle(@Body(bodyValidationSchema) body: CreateAccountBodySchema) {
    const { document, email, name, password, role } = body

    const result = await this.createAccount.execute({
      document,
      email,
      name,
      password,
      role,
    })

    if (result.isLeft()) {
      const { message } = result.value

      throw new BadRequestException({
        message,
      })
    }
  }
}
