import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { EditRecipientUseCase } from '@/domain/logistics/application/use-cases/edit-recipient'
import { RecipientPresenter } from '../presenters/recipient-presenter'
import { DocumentInvalidError } from '@/domain/logistics/enterprise/entities/errors/document-invalid-error'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { RequireRoles } from '@/infra/auth/permission-user-decorator'

const editRecipientBodySchema = z.object({
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

const bodyValidationSchema = new ZodValidationPipe(editRecipientBodySchema)

type EditRecipientBodySchema = z.infer<typeof editRecipientBodySchema>

@Controller('/recipients')
export class EditRecipientController {
  constructor(private editRecipientUseCase: EditRecipientUseCase) {}

  @Patch(':id')
  @UseGuards(RequireRoles('ADMIN'))
  async handle(
    @Param('id') id: string,
    @Body(bodyValidationSchema) body: EditRecipientBodySchema,
  ) {
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

    const result = await this.editRecipientUseCase.execute({
      id,
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
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      recipient: RecipientPresenter.toHTTP(result.value.recipient),
    }
  }
}
