import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common'
import z from 'zod'
import { ZodValidationPipe } from '../pipes/zod-validation-pipes'
import { FetchRecipientsUseCase } from '@/domain/logistics/application/use-cases/fetch-recipients'
import { RecipientPresenter } from '../presenters/recipient-presenter'
import { RequireRoles } from '@/infra/auth/permission-user-decorator'

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

@Controller('/recipients')
export class FetchRecipientsController {
  constructor(private fetchRecipientsUseCase: FetchRecipientsUseCase) {}

  @Get()
  @UseGuards(RequireRoles('ADMIN'))
  async handle(@Query(QueryValidationPipe) query: PageQueryParamSchema) {
    const { page, perPage } = query

    const result = await this.fetchRecipientsUseCase.execute({
      page,
      perPage,
    })

    if (result.isLeft()) {
      throw new BadRequestException()
    }

    return {
      recipients: result.value.recipients.map(RecipientPresenter.toHTTP),
    }
  }
}
