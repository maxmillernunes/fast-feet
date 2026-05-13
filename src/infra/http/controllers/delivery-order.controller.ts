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
import { DeliveryOrderUseCase } from '@/domain/logistics/application/use-cases/delivery-order'
import { OrderPresenter } from '../presenters/order-presenter'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { DeliveryDriverDoesNotMatchError } from '@/domain/logistics/enterprise/entities/errors/delivery-driver-does-not-match-error'
import { OrderCanNotTransitionToDeliveryError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-delivery-error'

const deliveryOrderBodySchema = z.object({
  deliveryDriveId: z.string(),
  attachmentIds: z.array(z.string()),
})

const bodyValidationSchema = new ZodValidationPipe(deliveryOrderBodySchema)

type DeliveryOrderBodySchema = z.infer<typeof deliveryOrderBodySchema>

@Controller('/orders')
export class DeliveryOrderController {
  constructor(private deliveryOrderUseCase: DeliveryOrderUseCase) {}

  @Post(':id/deliver')
  async handle(
    @Param('id') id: string,
    @Body(bodyValidationSchema) body: DeliveryOrderBodySchema,
  ) {
    const { deliveryDriveId, attachmentIds } = body

    const result = await this.deliveryOrderUseCase.execute({
      orderId: id,
      deliveryDriveId,
      attachmentIds,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case DeliveryDriverDoesNotMatchError:
          throw new BadRequestException(error.message)
        case OrderCanNotTransitionToDeliveryError:
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
