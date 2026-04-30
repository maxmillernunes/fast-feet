import { RequireRoles } from '@/infra/auth/permission-user-decorator'
import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { FetchDeliveryDriversUseCase } from '@/domain/iam/application/use-cases/fetch-delivery-drivers'
import { DeliveryDriverPresenter } from '../presenters/delivery-driver-presenter'

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

@Controller('/delivery-drivers')
export class FetchDeliveryDriversController {
  constructor(private fetchDeliveryDrivers: FetchDeliveryDriversUseCase) {}

  @Get()
  @UseGuards(RequireRoles('ADMIN'))
  async handle(@Query(QueryValidationPipe) query: PageQueryParamSchema) {
    const { page, perPage } = query

    const result = await this.fetchDeliveryDrivers.execute({
      page,
      perPage,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    const drivers = result.value.drivers.map(DeliveryDriverPresenter.toHTTP)

    return {
      drivers,
      total: result.value.total,
      page: result.value.page,
      perPage: result.value.perPage,
    }
  }
}
