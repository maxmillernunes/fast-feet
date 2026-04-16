import { B } from '@faker-js/faker/dist/airline-eVQV6kbz'
import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { PrismaService } from '@/infra/database/prisma/prisma.service'
import { compare } from 'bcrypt'

const authenticateBodySchema = z.object({
  document: z.string().min(11),
  password: z.string().min(6),
})

const bodyValidationSchema = new ZodValidationPipe(authenticateBodySchema)

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

@Controller('/sessions')
export class AuthenticateController {
  constructor(
    private jwt: JwtService,
    private prisma: PrismaService,
  ) {}

  @Post()
  async handle(@Body(bodyValidationSchema) body: AuthenticateBodySchema) {
    const { document, password } = body

    const user = await this.prisma.user.findFirst({
      where: { document },
    })

    if (!user) {
      throw new UnauthorizedException('User credentials do not match')
    }

    const isPasswordValid = await compare(password, user.password)

    if (!isPasswordValid) {
      throw new UnauthorizedException('User credentials do not match')
    }

    const accessToken = await this.jwt.signAsync({ sub: user.id })

    return { access_token: accessToken }
  }
}
