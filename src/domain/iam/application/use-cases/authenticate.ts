import { Either, left, right } from '@/core/either'
import { InvalidCredentialsError } from '../../enterprise/entities/errors/invalid-credentials-error'
import { HashComparer } from '../cryptography/hash-comparer'
import type { UsersRepository } from '../repositories/users-repository'
import type { User } from '../../enterprise/entities/user'

interface AuthenticateRequest {
  login: string
  password: string
}

type AuthenticateResponse = Either<InvalidCredentialsError, { admin: User }>

export class AuthenticateUseCase {
  constructor(
    private adminsRepository: UsersRepository,
    private hashComparer: HashComparer,
  ) {}

  async execute({
    login,
    password,
  }: AuthenticateRequest): Promise<AuthenticateResponse> {
    const admin = await this.adminsRepository.findByLogin(login)

    if (!admin) {
      return left(new InvalidCredentialsError())
    }

    const isPasswordValid = await this.hashComparer.compare(
      password,
      admin.password.value,
    )

    if (!isPasswordValid) {
      return left(new InvalidCredentialsError())
    }

    return right({ admin })
  }
}
