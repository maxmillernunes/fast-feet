import type { User } from '@/domain/iam/enterprise/entities/user'

export class DeliveryDriverPresenter {
  static toHTTP(deliveryDriver: User) {
    return {
      id: deliveryDriver.id.toString(),
      name: deliveryDriver.name,
      email: deliveryDriver.email,
      document: deliveryDriver.document,
      createdAt: deliveryDriver.createdAt,
      updatedAt: deliveryDriver.updatedAt,
      deletedAt: deliveryDriver.deletedAt,
    }
  }
}
