import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { FetchNearbyOrdersUseCase } from '@/domain/logistics/application/use-cases/fetch-nearby-orders'
import { OrderPresenter } from '../presenters/order-presenter'
import { RequireRoles } from '@/infra/auth/permission-user-decorator'

const fetchNearbyOrdersQuerySchema = z.object({
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
})

const QueryValidationPipe = new ZodValidationPipe(fetchNearbyOrdersQuerySchema)

type FetchNearbyOrdersQuerySchema = z.infer<typeof fetchNearbyOrdersQuerySchema>

@Controller('/orders')
export class FetchNearbyOrdersController {
  constructor(private fetchNearbyOrdersUseCase: FetchNearbyOrdersUseCase) {}

  @Get('/nearby')
  @UseGuards(RequireRoles('DRIVER'))
  async handle(
    @Query(QueryValidationPipe) query: FetchNearbyOrdersQuerySchema,
  ) {
    const { latitude, longitude } = query

    const result = await this.fetchNearbyOrdersUseCase.execute({
      userLatitude: latitude,
      userLongitude: longitude,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    return {
      orders: result.value.orders.map(OrderPresenter.toHTTP),
    }
  }
}
