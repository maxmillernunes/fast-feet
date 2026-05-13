import { BadRequestException, Controller, Get, Query } from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { FetchDriverOrdersUseCase } from '@/domain/logistics/application/use-cases/fetch-driver-orders'
import type { StatusOptions } from '@/domain/logistics/enterprise/entities/values-objects/order-status'
import { OrderPresenter } from '../presenters/order-presenter'

const fetchDriverOrdersQuerySchema = z.object({
  driverId: z.string(),
  status: z.string().transform((val) => val.split(',') as StatusOptions[]),
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

const QueryValidationPipe = new ZodValidationPipe(fetchDriverOrdersQuerySchema)

type FetchDriverOrdersQuerySchema = z.infer<typeof fetchDriverOrdersQuerySchema>

@Controller('/orders')
export class FetchDriverOrdersController {
  constructor(private fetchDriverOrdersUseCase: FetchDriverOrdersUseCase) {}

  @Get('/driver')
  async handle(
    @Query(QueryValidationPipe) query: FetchDriverOrdersQuerySchema,
  ) {
    const { driverId, status, page, perPage } = query

    const result = await this.fetchDriverOrdersUseCase.execute({
      driverId,
      status,
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
