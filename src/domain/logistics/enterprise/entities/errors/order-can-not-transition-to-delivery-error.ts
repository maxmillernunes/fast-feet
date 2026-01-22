export class OrderCanNotTransitionToDeliveryError extends Error {
  constructor() {
    super('Order must be in PICKED_UP status to be delivered.')
  }
}
