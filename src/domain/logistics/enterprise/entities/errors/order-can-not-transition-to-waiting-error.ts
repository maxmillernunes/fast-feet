export class OrderCanNotTransitionToWaitingError extends Error {
  constructor() {
    super('Order must be in CREATED status to be marked as waiting.')
  }
}
