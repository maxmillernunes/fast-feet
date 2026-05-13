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
import { PickUpOrderUseCase } from '@/domain/logistics/application/use-cases/pickup-order'
import { OrderPresenter } from '../presenters/order-presenter'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { OrderCanNotTransitionToPickUpError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-pickup-error'

const pickupOrderBodySchema = z.object({
  deliveryDriveId: z.string(),
})

const bodyValidationSchema = new ZodValidationPipe(pickupOrderBodySchema)

type PickUpOrderBodySchema = z.infer<typeof pickupOrderBodySchema>

@Controller('/orders')
export class PickUpOrderController {
  constructor(private pickUpOrderUseCase: PickUpOrderUseCase) {}

  @Post(':id/pickup')
  async handle(
    @Param('id') id: string,
    @Body(bodyValidationSchema) body: PickUpOrderBodySchema,
  ) {
    const { deliveryDriveId } = body

    const result = await this.pickUpOrderUseCase.execute({
      orderId: id,
      deliveryDriveId,
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
