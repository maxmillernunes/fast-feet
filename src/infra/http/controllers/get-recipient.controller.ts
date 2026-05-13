import { Controller, Get, NotFoundException, Param } from '@nestjs/common'
import { GetRecipientByIdUseCase } from '@/domain/logistics/application/use-cases/get-recipient-by-id'
import { RecipientPresenter } from '../presenters/recipient-presenter'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'

@Controller('/recipients')
export class GetRecipientController {
  constructor(private getRecipientByIdUseCase: GetRecipientByIdUseCase) {}

  @Get(':id')
  async handle(@Param('id') id: string) {
    const result = await this.getRecipientByIdUseCase.execute({
      recipientId: id,
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
      recipient: RecipientPresenter.toHTTP(result.value.recipient),
    }
  }
}
