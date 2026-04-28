import { Either, left, right } from '@/core/either'
import { WrongCredentialsError } from './errors/wrong-credentials-error'
import { HashComparer } from '../cryptography/hash-comparer'
import { Encrypter } from '../cryptography/encrypter'
import { UsersRepository } from '../repositories/users-repository'
import type { User } from '../../enterprise/entities/user'
import { Injectable } from '@nestjs/common'

interface AuthenticateRequest {
  login: string
  password: string
}

type AuthenticateResponse = Either<
  WrongCredentialsError,
  { user: User; access_token: string }
>

@Injectable()
export class AuthenticateUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashComparer: HashComparer,
    private encrypter: Encrypter,
  ) {}

  async execute({
    login,
    password,
  }: AuthenticateRequest): Promise<AuthenticateResponse> {
    const user = await this.usersRepository.findByLogin(login)

    if (!user) {
      return left(new WrongCredentialsError())
    }

    const isPasswordValid = await this.hashComparer.compare(
      password,
      user.password.value,
    )

    if (!isPasswordValid) {
      return left(new WrongCredentialsError())
    }

    const access_token = await this.encrypter.encrypt({
      sub: user.id.toString(),
    })

    return right({ user, access_token })
  }
}
