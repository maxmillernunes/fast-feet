import { Either, left, right } from '@/core/either'
import { InvalidCredentialsError } from '../../enterprise/entities/errors/invalid-credentials-error'
import { UsersRepository } from '../repositories/users-repository'
import { HashComparer } from '../cryptography/hash-comparer'
import { User } from '../../enterprise/entities/user'

interface AuthenticateRequest {
  login: string
  password: string
}

type AuthenticateResponse = Either<InvalidCredentialsError, { user: User }>

export class AuthenticateUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashComparer: HashComparer,
  ) {}

  async execute({
    login,
    password,
  }: AuthenticateRequest): Promise<AuthenticateResponse> {
    const user = await this.usersRepository.findByLogin(login)

    if (!user) {
      return left(new InvalidCredentialsError())
    }

    const isPasswordValid = await this.hashComparer.compare(
      password,
      user.password.value,
    )

    if (!isPasswordValid) {
      return left(new InvalidCredentialsError())
    }

    return right({ user })
  }
}
