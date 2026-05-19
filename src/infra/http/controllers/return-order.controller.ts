import {
  BadRequestException,
  Controller,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { ReturnOrderUseCase } from '@/domain/logistics/application/use-cases/return-order'
import { OrderPresenter } from '../presenters/order-presenter'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { DeliveryDriverDoesNotMatchError } from '@/domain/logistics/enterprise/entities/errors/delivery-driver-does-not-match-error'
import { OrderCanNotTransitionToReturnedError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-returned-error'
import { RequireRoles } from '@/infra/auth/permission-user-decorator'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'

@Controller('/orders')
export class ReturnOrderController {
  constructor(private returnOrderUseCase: ReturnOrderUseCase) {}

  @Post(':id/return')
  @UseGuards(RequireRoles('DRIVER'))
  async handle(@Param('id') id: string, @CurrentUser() user: UserPayload) {
    const { sub } = user

    const result = await this.returnOrderUseCase.execute({
      orderId: id,
      deliveryDriveId: sub,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case DeliveryDriverDoesNotMatchError:
          throw new BadRequestException(error.message)
        case OrderCanNotTransitionToReturnedError:
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
