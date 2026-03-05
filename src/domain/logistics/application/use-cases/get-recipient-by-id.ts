import { left, right, type Either } from '@/core/either'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import type { Recipient } from '../../enterprise/entities/recipient'
import type { RecipientsRepository } from '../repositories/recipients-repository'

interface GetRecipientByIdUseCaseRequest {
  recipientId: string
  // adminId?: string // TO-DO: When implementing ADMIN role, use this to check permission
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
    // adminId,
  }: GetRecipientByIdUseCaseRequest): Promise<GetRecipientByIdUseCaseResponse> {
    // TO-DO: When implementing ADMIN role, uncomment and validate:
    // const isAdmin = adminId ? true : false // Replace with real role check
    // if (!isAdmin) {
    //   return left(new NotAllowedError())
    // }

    const recipient = await this.recipientsRepository.findById(recipientId)

    if (!recipient) {
      return left(new ResourceNotFoundError())
    }

    return right({ recipient })
  }
}
