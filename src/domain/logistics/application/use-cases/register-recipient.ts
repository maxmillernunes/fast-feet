import { left, right, type Either } from '@/core/either'
import { Document } from '../../enterprise/entities/values-objects/document'
import { Recipient } from '../../enterprise/entities/recipient'
import { RecipientsRepository } from '../repositories/recipients-repository'
import type { DocumentInvalidError } from '../../enterprise/entities/errors/document-invalid-error'
import { ResourceAlreadyExistsError } from '@/core/errors/errors/resource-already-exists-error'

interface RegisterRecipientUseCaseRequest {
  name: string
  document: string
  country: string
  zipCode: string
  state: string
  city: string
  street: string
  neighborhood: string
  complement?: string
  latitude: number
  longitude: number
}

type RegisterRecipientUseCaseResponse = Either<
  DocumentInvalidError | ResourceAlreadyExistsError,
  {
    recipient: Recipient
  }
>

export class RegisterRecipientUseCase {
  constructor(private recipientsRepository: RecipientsRepository) {}

  async execute({
    name,
    document,
    city,
    state,
    street,
    zipCode,
    country,
    latitude,
    longitude,
    complement,
    neighborhood,
  }: RegisterRecipientUseCaseRequest): Promise<RegisterRecipientUseCaseResponse> {
    const documentResult = Document.create(document)

    if (documentResult.isLeft()) {
      const error = documentResult.value

      return left(error)
    }

    const documentCreated = documentResult.value

    const recipientExist = await this.recipientsRepository.findByDocument(
      documentCreated.getValue(),
    )

    if (recipientExist) {
      return left(new ResourceAlreadyExistsError())
    }

    const recipient = Recipient.create({
      name,
      document: documentCreated,
      country,
      zipCode,
      state,
      city,
      street,
      neighborhood,
      complement,
      latitude,
      longitude,
    })

    await this.recipientsRepository.create(recipient)

    return right({ recipient })
  }
}
