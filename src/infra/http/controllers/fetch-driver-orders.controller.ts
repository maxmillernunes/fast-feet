import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { FetchDriverOrdersUseCase } from '@/domain/logistics/application/use-cases/fetch-driver-orders'
import type { StatusOptions } from '@/domain/logistics/enterprise/entities/values-objects/order-status'
import { OrderPresenter } from '../presenters/order-presenter'
import { RequireRoles } from '@/infra/auth/permission-user-decorator'
import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'

const fetchDriverOrdersQuerySchema = z.object({
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
  @UseGuards(RequireRoles('DRIVER'))
  async handle(
    @Query(QueryValidationPipe) query: FetchDriverOrdersQuerySchema,
    @CurrentUser() user: UserPayload,
  ) {
    const { status, page, perPage } = query
    const { sub } = user

    const result = await this.fetchDriverOrdersUseCase.execute({
      driverId: sub,
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
