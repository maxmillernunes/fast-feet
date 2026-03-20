# LOGISTICS ENTERPRISE

Entidades e Value Objects do domínio.

## ENTITY: ORDER

```typescript
export class Order extends Entity<OrderProps> {
  // Getters
  get status(): OrderStatus
  get recipientId(): UniqueEntityId

  // Métodos de domínio
  pickUp(driverId: UniqueEntityId): Either<Error, null>
  deliver(driverId: UniqueEntityId): Either<Error, null>
  return(driverId: UniqueEntityId): Either<Error, null>

  // Factory
  static create(props, id?): Order
}
```

## ENTITY: RECIPIENT

```typescript
export class Recipient extends Entity<RecipientProps> {
  get name(): string
  get document(): Document
  get latitude(): number
  get longitude(): number

  update(props: Partial<RecipientProps>): void
}
```

## VALUE OBJECT: ORDER STATUS

```typescript
export class OrderStatus extends ValueObject<{ value: string }> {
  static create(status?: string): OrderStatus
  canTransitionTo(status: string): boolean
}
```

## VALUE OBJECT: DOCUMENT

```typescript
export class Document {
  static create(raw: string): Either<Error, Document>
  static format(doc: string): string // Remove não-dígitos
  getValue(): string
  getType(): 'CPF' | 'CNPJ'
}
```

## ERROS DE DOMÍNIO

```typescript
// Transição inválida de status
OrderCanNotTransitionToPickUpError
OrderCanNotTransitionToDeliveryError
OrderCanNotTransitionToReturnedError

// Entregador não corresponde
DeliveryDriverDoesNotMatchError
```
