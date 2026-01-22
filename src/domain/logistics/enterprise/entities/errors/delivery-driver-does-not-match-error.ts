export class DeliveryDriverDoesNotMatchError extends Error {
  constructor() {
    super(
      'The delivery driver does not match the assigned driver for this order.',
    )
  }
}
