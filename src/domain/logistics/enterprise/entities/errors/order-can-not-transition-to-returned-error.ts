export class OrderCanNotTransitionToReturnedError extends Error {
  constructor() {
    super('Order must be in PICKED_UP status to be returned.')
  }
}
