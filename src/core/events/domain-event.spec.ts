import { AggregateRoot } from '../entities/aggregate-root'
import type { UniqueEntityId } from '../entities/unique-entity-id'
import { DomainEvent } from './domain-event'
import { DomainEvents } from './domain-events'

/**
 * This is a simple implementation of a domain event, is a consumer of the aggregate root.
 */
class CustomAggregateCreated implements DomainEvent {
  public occurredAt: Date
  private aggregate: CustomAggregate

  constructor(aggregate: CustomAggregate) {
    this.aggregate = aggregate
    this.occurredAt = new Date()
  }

  public getAggregateId(): UniqueEntityId {
    return this.aggregate.id
  }
}

/**
 * This is a simple implementation of an aggregate root that emits a domain event when it is created.
 */
class CustomAggregate extends AggregateRoot<null> {
  static create() {
    const aggregate = new CustomAggregate(null)

    aggregate.addDomainEvent(new CustomAggregateCreated(aggregate))

    return aggregate
  }
}

describe('DomainEvent', () => {
  it('should emit a domain event when an aggregate root is created', () => {
    const callback = vi.fn()

    DomainEvents.register(callback, CustomAggregateCreated.name)

    const aggregate = CustomAggregate.create()

    expect(aggregate.domainEvents.length).toBe(1)
    expect(aggregate.domainEvents[0]).toBeInstanceOf(CustomAggregateCreated)

    DomainEvents.dispatchEventsForAggregate(aggregate.id)

    expect(callback).toHaveBeenCalled()
    expect(aggregate.domainEvents).toHaveLength(0)
  })
})
