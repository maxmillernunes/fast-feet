import { left, right, type Either } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import type { Recipient } from '../../enterprise/entities/recipient'
import type { RecipientsRepository } from '../repositories/recipients-repository'

interface GetRecipientByIdUseCaseRequest {
  recipientId: string
}

type GetRecipientByIdUseCaseResponse = Either<
  ResourceNotFoundError,
  {
    recipient: Recipient
  }
>

export class GetRecipientByIdUseCase {
  constructor(private recipientsRepository: RecipientsRepository) {}

  async execute({
    recipientId,
  }: GetRecipientByIdUseCaseRequest): Promise<GetRecipientByIdUseCaseResponse> {
    const recipient = await this.recipientsRepository.findById(recipientId)

    if (!recipient) {
      return left(new ResourceNotFoundError())
    }

    return right({ recipient })
  }
}
