import { Injectable } from '@nestjs/common'
import { right, type Either } from '@/core/either'
import type { Recipient } from '../../enterprise/entities/recipient'
import { RecipientsRepository } from '../repositories/recipients-repository'

interface FetchRecipientsUseCaseRequest {
  page?: number
  perPage?: number
}

type FetchRecipientsUseCaseResponse = Either<
  null,
  {
    recipients: Recipient[]
  }
>

@Injectable()
export class FetchRecipientsUseCase {
  constructor(private recipientsRepository: RecipientsRepository) {}

  async execute({
    page = 1,
    perPage = 10,
  }: FetchRecipientsUseCaseRequest): Promise<FetchRecipientsUseCaseResponse> {
    const recipients = await this.recipientsRepository.findMany({
      page,
      perPage,
    })

    return right({ recipients })
  }
}
