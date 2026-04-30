import { RequireRoles } from '@/infra/auth/permission-user-decorator'
import {
  BadRequestException,
  Controller,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common'
import { DeleteDeliveryDriverByIdUseCase } from '@/domain/iam/application/use-cases/delete-delivery-driver'
import { DriverNotFoundError } from '@/domain/iam/application/use-cases/errors/user-not-found-error'

@Controller('/delivery-drivers/:id')
export class DeleteDeliveryDriversController {
  constructor(private deleteDeliveryDriver: DeleteDeliveryDriverByIdUseCase) {}

  @Delete()
  @UseGuards(RequireRoles('ADMIN'))
  async handle(@Param('id') id: string) {
    const result = await this.deleteDeliveryDriver.execute({
      driverId: id,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case DriverNotFoundError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }
  }
}
