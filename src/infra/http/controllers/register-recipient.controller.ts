import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Post,
  UseGuards,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { RegisterRecipientUseCase } from '@/domain/logistics/application/use-cases/register-recipient'
import { RecipientPresenter } from '../presenters/recipient-presenter'
import { DocumentInvalidError } from '@/domain/logistics/enterprise/entities/errors/document-invalid-error'
import { ResourceAlreadyExistsError } from '@/core/errors/errors/resource-already-exists-error'
import { RequireRoles } from '@/infra/auth/permission-user-decorator'

const registerRecipientBodySchema = z.object({
  name: z.string(),
  document: z.string(),
  country: z.string(),
  zipCode: z.string(),
  state: z.string(),
  city: z.string(),
  street: z.string(),
  neighborhood: z.string(),
  complement: z.string().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
})

const bodyValidationSchema = new ZodValidationPipe(registerRecipientBodySchema)

type RegisterRecipientBodySchema = z.infer<typeof registerRecipientBodySchema>

@Controller('/recipients')
export class RegisterRecipientController {
  constructor(private registerRecipientUseCase: RegisterRecipientUseCase) {}

  @Post()
  @UseGuards(RequireRoles('ADMIN'))
  async handle(@Body(bodyValidationSchema) body: RegisterRecipientBodySchema) {
    const {
      name,
      document,
      country,
      zipCode,
      state,
      city,
      street,
      neighborhood,
      complement,
      latitude,
      longitude,
    } = body

    const result = await this.registerRecipientUseCase.execute({
      name,
      document,
      country,
      zipCode,
      state,
      city,
      street,
      neighborhood,
      complement,
      latitude,
      longitude,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DocumentInvalidError:
          throw new BadRequestException(error.message)
        case ResourceAlreadyExistsError:
          throw new ConflictException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      recipient: RecipientPresenter.toHTTP(result.value.recipient),
    }
  }
}
