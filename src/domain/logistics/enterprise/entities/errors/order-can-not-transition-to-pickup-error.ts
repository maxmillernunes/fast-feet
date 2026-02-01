export class OrderCanNotTransitionToPickUpError extends Error {
  constructor() {
    super('Order must be in WAITING status to be picked up.')
  }
}
