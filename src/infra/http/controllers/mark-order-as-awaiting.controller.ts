import {
  BadRequestException,
  Controller,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import { MarkOrderAsAwaitingUseCase } from '@/domain/logistics/application/use-cases/mark-order-as-awaiting'
import { OrderPresenter } from '../presenters/order-presenter'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { OrderCanNotTransitionToWaitingError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-waiting-error'
import { RequireRoles } from '@/infra/auth/permission-user-decorator'

@Controller('/orders')
export class MarkOrderAsAwaitingController {
  constructor(private markOrderAsAwaitingUseCase: MarkOrderAsAwaitingUseCase) {}

  @Post(':id/awaiting')
  @UseGuards(RequireRoles('ADMIN'))
  async handle(@Param('id') id: string) {
    const result = await this.markOrderAsAwaitingUseCase.execute({
      orderId: id,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case OrderCanNotTransitionToWaitingError:
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
