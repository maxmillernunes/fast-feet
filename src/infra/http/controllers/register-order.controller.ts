import {
  Body,
  Controller,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { RegisterOrderUseCase } from '@/domain/logistics/application/use-cases/register-order'
import { OrderPresenter } from '../presenters/order-presenter'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { RequireRoles } from '@/infra/auth/permission-user-decorator'

const registerOrderBodySchema = z.object({
  recipientId: z.string(),
})

const bodyValidationSchema = new ZodValidationPipe(registerOrderBodySchema)

type RegisterOrderBodySchema = z.infer<typeof registerOrderBodySchema>

@Controller('/orders')
export class RegisterOrderController {
  constructor(private registerOrderUseCase: RegisterOrderUseCase) {}

  @Post()
  @UseGuards(RequireRoles('ADMIN'))
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
