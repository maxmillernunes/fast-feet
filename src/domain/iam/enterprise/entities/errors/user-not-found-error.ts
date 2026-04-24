export class DriverNotFoundError extends Error {
  constructor(identifier: string) {
    super(`Driver not found: ${identifier}`)
  }
}
