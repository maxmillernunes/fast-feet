import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common'
import z from 'zod'
import { RequireRoles } from '@/infra/auth/permission-user-decorator'
import { DriverNotFoundError } from '@/domain/iam/application/use-cases/errors/user-not-found-error'
import { UpdateDeliveryDriverUseCase } from '@/domain/iam/application/use-cases/update-delivery-driver'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { InvalidPasswordError } from '@/domain/iam/enterprise/entities/errors/invalid-password-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

const updateDeliveryDriverBodySchema = z.object({
  password: z.string(),
})

const bodyValidationSchema = new ZodValidationPipe(
  updateDeliveryDriverBodySchema,
)

type UpdateDeliveryDriverBodySchema = z.infer<
  typeof updateDeliveryDriverBodySchema
>

@Controller('/delivery-drivers/:id')
export class UpdateDeliveryDriversController {
  constructor(private updateDeliveryDriver: UpdateDeliveryDriverUseCase) {}

  @Put()
  @UseGuards(RequireRoles('ADMIN'))
  async handle(
    @Body(bodyValidationSchema) body: UpdateDeliveryDriverBodySchema,
    @Param('id') id: string,
  ) {
    const result = await this.updateDeliveryDriver.execute({
      driverId: id,
      password: body.password,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DriverNotFoundError || InvalidPasswordError || NotAllowedError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
