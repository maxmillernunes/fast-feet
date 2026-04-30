import { Either, left, right } from '@/core/either'
import { InvalidDocumentError } from '../../enterprise/entities/errors/invalid-document-error'
import { AccountAlreadyExistsError } from './errors/account-already-exists-error'
import { InvalidPasswordError } from '../../enterprise/entities/errors/invalid-password-error'
import { Password } from '../../enterprise/entities/values-objects/password'
import { HashGenerator } from '../cryptography/hash-generator'
import { Document } from '../../enterprise/entities/values-objects/document'
import { Injectable } from '@nestjs/common'
import { User, UserRole } from '../../enterprise/entities/user'
import { UsersRepository } from '../repositories/users-repository'

interface CreateCreateAccountUseCaseRequest {
  name: string
  document: string
  password: string
  email: string
  role: UserRole
}

type CreateCreateAccountUseCaseResponse = Either<
  InvalidDocumentError | AccountAlreadyExistsError | InvalidPasswordError,
  { user: User }
>

@Injectable()
export class CreateAccountUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    name,
    document,
    password,
    email,
    role,
  }: CreateCreateAccountUseCaseRequest): Promise<CreateCreateAccountUseCaseResponse> {
    if (!Document.validate(document)) {
      return left(new InvalidDocumentError(document))
    }

    const existsUserWithSameDocument =
      await this.usersRepository.findByLogin(document)

    if (existsUserWithSameDocument) {
      return left(new AccountAlreadyExistsError(document))
    }

    const existsUserWithSameEmail =
      await this.usersRepository.findByEmail(email)

    if (existsUserWithSameEmail) {
      return left(new AccountAlreadyExistsError(email))
    }

    const passwordResult = Password.createFromText(password)

    if (passwordResult.isLeft()) {
      return left(passwordResult.value)
    }

    const hashedPassword = await this.hashGenerator.hash(password)
    const hashedPasswordVO = Password.create(hashedPassword)

    const user = User.create({
      name,
      document,
      email,
      role,
      password: hashedPasswordVO,
    })

    await this.usersRepository.create(user)

    return right({ user })
  }
}
