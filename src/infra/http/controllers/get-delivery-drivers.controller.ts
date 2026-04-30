import { RequireRoles } from '@/infra/auth/permission-user-decorator'
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common'
import { DeliveryDriverPresenter } from '../presenters/delivery-driver-presenter'
import { GetDeliveryDriverByIdUseCase } from '@/domain/iam/application/use-cases/get-delivery-driver-by-id'

@Controller('/delivery-drivers/:id')
export class GetDeliveryDriversController {
  constructor(private getDeliveryDriver: GetDeliveryDriverByIdUseCase) {}

  @Get()
  @UseGuards(RequireRoles('ADMIN'))
  async handle(@Param('id') id: string) {
    const result = await this.getDeliveryDriver.execute({
      driverId: id,
    })

    if (result.isLeft()) {
      const error = result.value
      throw new BadRequestException(error.message)
    }

    return {
      driver: DeliveryDriverPresenter.toHTTP(result.value.driver),
    }
  }
}
