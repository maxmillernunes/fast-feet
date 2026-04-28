export class AccountAlreadyExistsError extends Error {
  constructor(prop: string) {
    super(`Account with ${prop} already exists.`)
  }
}
