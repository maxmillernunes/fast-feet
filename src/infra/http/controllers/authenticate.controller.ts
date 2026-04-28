import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UnauthorizedException,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { AuthenticateUseCase } from '@/domain/iam/application/use-cases/authenticate'
import { WrongCredentialsError } from '@/domain/iam/application/use-cases/errors/wrong-credentials-error'
import { Public } from '@/infra/auth/public'

const authenticateBodySchema = z.object({
  login: z.string().min(11),
  password: z.string().min(6),
})

const bodyValidationSchema = new ZodValidationPipe(authenticateBodySchema)

type AuthenticateBodySchema = z.infer<typeof authenticateBodySchema>

@Controller('/sessions')
@Public()
export class AuthenticateController {
  constructor(private authenticate: AuthenticateUseCase) {}

  @Post()
  async handle(@Body(bodyValidationSchema) body: AuthenticateBodySchema) {
    const { login, password } = body

    const result = await this.authenticate.execute({
      login,
      password,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case WrongCredentialsError:
          throw new UnauthorizedException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    const { access_token } = result.value

    return { access_token }
  }
}
