import type { PaginationParams } from '@/core/repositories /pagination-params'
import type { Recipient } from '../../enterprise/entities/recipient'

export abstract class RecipientsRepository {
  abstract findById(id: string): Promise<Recipient | null>
  abstract findByDocument(document: string): Promise<Recipient | null>
  abstract findMany(params: PaginationParams): Promise<Recipient[]>
  abstract create(data: Recipient): Promise<void>
  abstract save(data: Recipient): Promise<void>
  abstract delete(recipient: Recipient): Promise<void>
}
