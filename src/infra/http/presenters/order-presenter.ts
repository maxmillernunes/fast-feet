import type { Order } from '@/domain/logistics/enterprise/entities/order'

export class OrderPresenter {
  static toHTTP(this: void, order: Order) {
    return {
      id: order.id.toString(),
      status: order.status.getContent(),
      recipientId: order.recipientId.toString(),
      deliveryDriveId: order.deliveryDriveId?.toString(),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      pickedAt: order.pickedAt,
      deliveredAt: order.deliveredAt,
    }
  }
}
