import { left, right, type Either } from '@/core/either'
import type { Recipient } from '../../enterprise/entities/recipient'
import type { RecipientsRepository } from '../repositories/recipients-repository'
import { ResourceNotFoundError } from '@/core/errors/errors/resource-not-found-error'
import { Document } from '../../enterprise/entities/values-objects/document'
import type { DocumentInvalidError } from '../../enterprise/entities/errors/document-invalid-error'

interface EditRecipientUseCaseRequest {
  id: string
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

type EditRecipientUseCaseResponse = Either<
  ResourceNotFoundError | DocumentInvalidError,
  { recipient: Recipient }
>

export class EditRecipientUseCase {
  constructor(private recipientsRepository: RecipientsRepository) {}

  async execute({
    id,
    city,
    country,
    document,
    latitude,
    longitude,
    name,
    neighborhood,
    state,
    street,
    zipCode,
    complement,
  }: EditRecipientUseCaseRequest): Promise<EditRecipientUseCaseResponse> {
    const recipient = await this.recipientsRepository.findById(id)

    if (!recipient) {
      return left(new ResourceNotFoundError())
    }

    const documentResult = Document.create(document)

    if (documentResult.isLeft()) {
      return left(documentResult.value)
    }

    recipient.update({
      city,
      country,
      document: documentResult.value,
      latitude,
      longitude,
      name,
      neighborhood,
      state,
      street,
      zipCode,
      complement,
    })

    await this.recipientsRepository.save(recipient)

    return right({ recipient })
  }
}
