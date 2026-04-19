import { Either, left, right } from '@/core/either'
import { InvalidPasswordError } from '../errors/invalid-password-error'

export class Password {
  public value: string

  constructor(value: string) {
    this.value = value
  }

  static createFromText(plain: string): Either<InvalidPasswordError, Password> {
    if (!Password.validate(plain)) {
      return left(new InvalidPasswordError())
    }

    return right(new Password(plain))
  }

  static validate(plain: string): boolean {
    if (plain.length < 8) return false
    if (!/[A-Z]/.test(plain)) return false
    if (!/[0-9]/.test(plain)) return false
    if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(plain)) return false
    return true
  }

  static create(value: string): Password {
    return new Password(value)
  }
}
