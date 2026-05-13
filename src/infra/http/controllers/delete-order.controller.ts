import {
  Controller,
  Delete,
  ForbiddenException,
  NotFoundException,
  Param,
} from '@nestjs/common'
import { DeleteOrderUseCase } from '@/domain/logistics/application/use-cases/delete-order'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'

@Controller('/orders')
export class DeleteOrderController {
  constructor(private deleteOrderUseCase: DeleteOrderUseCase) {}

  @Delete(':id')
  async handle(@Param('id') id: string) {
    const result = await this.deleteOrderUseCase.execute({
      orderId: id,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case NotAllowedError:
          throw new ForbiddenException(error.message)
        default:
          throw new NotFoundException(error.message)
      }
    }
  }
}
