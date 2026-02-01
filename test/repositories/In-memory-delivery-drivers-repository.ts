import type { DeliveryDriversRepository } from '@/domain/logistics/application/repositories/delivery-drivers-repository'

export class InMemoryDeliveryDriversRepository implements DeliveryDriversRepository {
  findById(id: string): Promise<any> {
    throw new Error('Method not implemented.')
  }

  create(data: any): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
