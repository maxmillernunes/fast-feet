import type { PaginationParams } from '@/core/repositories /pagination-params'
import type { DeliveryDriver } from '../../enterprise/entities/delivery-driver'

export abstract class DeliveryDriversRepository {
  abstract create(data: DeliveryDriver): Promise<void>
  abstract findByDocument(document: string): Promise<DeliveryDriver | null>
  abstract findByEmail(email: string): Promise<DeliveryDriver | null>
  abstract findById(email: string): Promise<DeliveryDriver | null>
  abstract findMany(params: PaginationParams): Promise<DeliveryDriver[]>
  abstract count(): Promise<number>
  abstract delete(data: DeliveryDriver): Promise<void>
  abstract save(data: DeliveryDriver): Promise<void>
}
