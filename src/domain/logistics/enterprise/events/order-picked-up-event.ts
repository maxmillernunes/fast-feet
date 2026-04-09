import type { DomainEvent } from '@/core/events/domain-event'
import type { Order } from '../entities/order'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'

export class OrderPickedUpEvent implements DomainEvent {
  public occurredAt: Date
  public order: Order

  constructor(order: Order) {
    this.order = order
    this.occurredAt = new Date()
  }

  getAggregateId(): UniqueEntityId {
    return this.order.id
  }
}
