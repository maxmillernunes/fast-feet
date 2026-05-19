import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { DeliveryOrderUseCase } from '@/domain/logistics/application/use-cases/delivery-order'
import { OrderPresenter } from '../presenters/order-presenter'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { DeliveryDriverDoesNotMatchError } from '@/domain/logistics/enterprise/entities/errors/delivery-driver-does-not-match-error'
import { OrderCanNotTransitionToDeliveryError } from '@/domain/logistics/enterprise/entities/errors/order-can-not-transition-to-delivery-error'
import { InvalidAttachmentSentError } from '@/domain/logistics/application/use-cases/erros/invalid-attachment-sent-error'
import { RequireRoles } from '@/infra/auth/permission-user-decorator'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'

const deliveryOrderBodySchema = z.object({
  attachmentIds: z
    .array(z.string().nonempty('Attachment ID must be a non-empty string'))
    .min(1, 'At least one attachment is required'),
})

const bodyValidationSchema = new ZodValidationPipe(deliveryOrderBodySchema)

type DeliveryOrderBodySchema = z.infer<typeof deliveryOrderBodySchema>

@Controller('/orders')
@UseGuards(RequireRoles('DRIVER'))
export class DeliveryOrderController {
  constructor(private deliveryOrderUseCase: DeliveryOrderUseCase) {}

  @Post(':id/deliver')
  async handle(
    @Param('id') id: string,
    @CurrentUser() user: UserPayload,
    @Body(bodyValidationSchema) body: DeliveryOrderBodySchema,
  ) {
    const { sub } = user
    const { attachmentIds } = body

    const result = await this.deliveryOrderUseCase.execute({
      orderId: id,
      deliveryDriveId: sub,
      attachmentIds,
    })

    if (result.isLeft()) {
      const error = result.value

      switch (error.constructor) {
        case ResourceNotFoundError:
          throw new NotFoundException(error.message)
        case DeliveryDriverDoesNotMatchError ||
          OrderCanNotTransitionToDeliveryError ||
          InvalidAttachmentSentError:
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
