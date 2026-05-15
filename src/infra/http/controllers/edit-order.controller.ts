import {
  Body,
  Controller,
  NotFoundException,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { EditOrderUseCase } from '@/domain/logistics/application/use-cases/edit-order'
import { OrderPresenter } from '../presenters/order-presenter'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { RequireRoles } from '@/infra/auth/permission-user-decorator'

const editOrderBodySchema = z.object({
  recipientId: z.string().optional(),
})

const bodyValidationSchema = new ZodValidationPipe(editOrderBodySchema)

type EditOrderBodySchema = z.infer<typeof editOrderBodySchema>

@Controller('/orders')
@UseGuards(RequireRoles('ADMIN', 'DRIVER'))
export class EditOrderController {
  constructor(private editOrderUseCase: EditOrderUseCase) {}

  @Patch(':id')
  async handle(
    @Param('id') id: string,
    @Body(bodyValidationSchema) body: EditOrderBodySchema,
  ) {
    const { recipientId } = body

    const result = await this.editOrderUseCase.execute({
      orderId: id,
      recipientId,
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
      order: OrderPresenter.toHTTP(result.value.order),
    }
  }
}
