import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { ReturnOrderUseCase } from '@/domain/logistics/application/use-cases/return-order'
import { OrderPresenter } from '../presenters/order-presenter'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { DeliveryDriverDoesNotMatchError } from '@/domain/logistics/enterprise/entities/errors/delivery-driver-does-not-match-error'
import { OrderCanNotTransitionToReturnedError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-returned-error'

const returnOrderBodySchema = z.object({
  deliveryDriveId: z.string(),
})

const bodyValidationSchema = new ZodValidationPipe(returnOrderBodySchema)

type ReturnOrderBodySchema = z.infer<typeof returnOrderBodySchema>

@Controller('/orders')
export class ReturnOrderController {
  constructor(private returnOrderUseCase: ReturnOrderUseCase) {}

  @Post(':id/return')
  async handle(
    @Param('id') id: string,
    @Body(bodyValidationSchema) body: ReturnOrderBodySchema,
  ) {
    const { deliveryDriveId } = body

    const result = await this.returnOrderUseCase.execute({
      orderId: id,
      deliveryDriveId,
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
