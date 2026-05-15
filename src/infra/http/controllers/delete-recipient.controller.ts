import {
  Controller,
  Delete,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common'
import { DeleteRecipientUseCase } from '@/domain/logistics/application/use-cases/delete-recipient'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { RequireRoles } from '@/infra/auth/permission-user-decorator'

@Controller('/recipients')
export class DeleteRecipientController {
  constructor(private deleteRecipientUseCase: DeleteRecipientUseCase) {}

  @Delete(':id')
  @UseGuards(RequireRoles('ADMIN'))
  async handle(@Param('id') id: string) {
    const result = await this.deleteRecipientUseCase.execute({
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
  }
}
