export class InvalidPasswordError extends Error {
  constructor() {
    super(
      'Invalid password. Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character.',
    )
  }
}
