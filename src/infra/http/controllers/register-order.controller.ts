import { Body, Controller, NotFoundException, Post } from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { RegisterOrderUseCase } from '@/domain/logistics/application/use-cases/register-order'
import { OrderPresenter } from '../presenters/order-presenter'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

const registerOrderBodySchema = z.object({
  recipientId: z.string(),
})

const bodyValidationSchema = new ZodValidationPipe(registerOrderBodySchema)

type RegisterOrderBodySchema = z.infer<typeof registerOrderBodySchema>

@Controller('/orders')
export class RegisterOrderController {
  constructor(private registerOrderUseCase: RegisterOrderUseCase) {}

  @Post()
  async handle(@Body(bodyValidationSchema) body: RegisterOrderBodySchema) {
    const { recipientId } = body

    const result = await this.registerOrderUseCase.execute({
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
