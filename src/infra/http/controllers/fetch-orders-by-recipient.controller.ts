import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { FetchRecentOrdersUseCase } from '@/domain/logistics/application/use-cases/fetch-orders-by-recipient-id'
import { OrderPresenter } from '../presenters/order-presenter'

const pageQueryParamSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform(Number)
    .pipe(z.number().min(1)),
  perPage: z
    .string()
    .optional()
    .default('10')
    .transform(Number)
    .pipe(z.number().min(1).max(100)),
})

const QueryValidationPipe = new ZodValidationPipe(pageQueryParamSchema)

type PageQueryParamSchema = z.infer<typeof pageQueryParamSchema>

@Controller('/orders')
export class FetchOrdersByRecipientController {
  constructor(
    private fetchOrdersByRecipientUseCase: FetchRecentOrdersUseCase,
  ) {}

  @Get('/recipient/:recipientId')
  async handle(
    @Param('recipientId') recipientId: string,
    @Query(QueryValidationPipe) query: PageQueryParamSchema,
  ) {
    const { page, perPage } = query

    const result = await this.fetchOrdersByRecipientUseCase.execute({
      recipientId,
      page,
      perPage,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    return {
      orders: result.value.orders.map(OrderPresenter.toHTTP),
    }
  }
}
