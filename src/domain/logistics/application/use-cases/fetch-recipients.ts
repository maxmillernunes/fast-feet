import { right, type Either } from '@/core/either'
import type { Recipient } from '../../enterprise/entities/recipient'
import type { RecipientsRepository } from '../repositories/recipients-repository'

interface FetchRecipientsUseCaseRequest {
  page?: number
  perPage?: number
  // adminId?: string // TO-DO: When implementing ADMIN role, use this to check permission
}

type FetchRecipientsUseCaseResponse = Either<
  null,
  {
    recipients: Recipient[]
  }
>

export class FetchRecipientsUseCase {
  constructor(private recipientsRepository: RecipientsRepository) {}

  async execute({
    page = 1,
    perPage = 10,
    // adminId,
  }: FetchRecipientsUseCaseRequest): Promise<FetchRecipientsUseCaseResponse> {
    // TO-DO: When implementing ADMIN role, uncomment and validate:
    // const isAdmin = adminId ? true : false // Replace with real role check
    // if (!isAdmin) {
    //   return left(new NotAllowedError())
    // }

    const recipients = await this.recipientsRepository.findMany({
      page,
      perPage,
    })

    return right({ recipients })
  }
}
