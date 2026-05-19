import {
  BadRequestException,
  Controller,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { PickUpOrderUseCase } from '@/domain/logistics/application/use-cases/pickup-order'
import { OrderPresenter } from '../presenters/order-presenter'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { OrderCanNotTransitionToPickUpError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-pickup-error'
import { RequireRoles } from '@/infra/auth/permission-user-decorator'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'

@Controller('/orders')
export class PickUpOrderController {
  constructor(private pickUpOrderUseCase: PickUpOrderUseCase) {}

  @Post(':id/pickup')
  @UseGuards(RequireRoles('DRIVER'))
  async handle(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const { sub } = user

    const result = await this.pickUpOrderUseCase.execute({
      orderId: id,
      deliveryDriveId: sub,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case OrderCanNotTransitionToPickUpError:
          throw new BadRequestException(error.message)
        default:
          throw new BadRequestException(error.message)
      }
    }

    return {
      order: OrderPresenter.toHTTP(result.value.order),
    }
  }
}
