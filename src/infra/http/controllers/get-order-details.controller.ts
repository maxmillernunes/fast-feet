import { Controller, Get, NotFoundException, Param } from '@nestjs/common'
import { GetOrderDetailsByIdUseCase } from '@/domain/logistics/application/use-cases/get-order-details-by-id'
import { OrderWithRecipientPresenter } from '../presenters/order-with-recipient-presenter'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

@Controller('/orders')
export class GetOrderDetailsController {
  constructor(private getOrderDetailsByIdUseCase: GetOrderDetailsByIdUseCase) {}

  @Get(':id')
  async handle(@Param('id') id: string) {
    const result = await this.getOrderDetailsByIdUseCase.execute({
      orderId: id,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        default:
          throw new NotFoundException(error.message)
      }
    }

    return {
      order: OrderWithRecipientPresenter.toHTTP(result.value.order),
    }
  }
}
