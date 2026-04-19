import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { InvalidDocumentError } from '../../enterprise/entities/errors/invalid-document-error'
import { UserAlreadyExistsError } from '../../enterprise/entities/errors/user-already-exists-error'
import { InvalidPasswordError } from '../../enterprise/entities/errors/invalid-password-error'
import { Password } from '../../enterprise/entities/values-objects/password'
import { UsersRepository } from '../repositories/users-repository'
import { HashGenerator } from '../cryptography/hash-generator'
import { User } from '../../enterprise/entities/user'
import { Document } from '../../enterprise/entities/values-objects/document'
import { DeliveryDriver } from '../../enterprise/entities/delivery-driver'
import { AdminsRepository } from '../repositories/admins-repository'
import { DeliveryDriversRepository } from '../repositories/delivery-drivers-repository'

interface CreateDeliveryDriverRequest {
  userId: string
  name: string
  document: string
  password: string
  email: string
}

type CreateDeliveryDriverResponse = Either<
  | NotAllowedError
  | InvalidDocumentError
  | UserAlreadyExistsError
  | InvalidPasswordError,
  { user: User }
>

export class CreateDeliveryDriverUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private adminsRepository: AdminsRepository,
    private deliveryDriversRepository: DeliveryDriversRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    userId,
    name,
    document,
    password,
    email,
  }: CreateDeliveryDriverRequest): Promise<CreateDeliveryDriverResponse> {
    if (!Document.validate(document)) {
      return left(new InvalidDocumentError(document))
    }

    const isAdmin = await this.adminsRepository.findById(userId)

    if (!isAdmin) {
      return left(new NotAllowedError())
    }

    const existingUser = await this.usersRepository.findByLogin(document)

    if (existingUser) {
      return left(new UserAlreadyExistsError(document))
    }

    const existsDeliveryDriver =
      await this.deliveryDriversRepository.findByEmail(email)

    if (existsDeliveryDriver) {
      return left(new UserAlreadyExistsError(document))
    }

    const passwordResult = Password.createFromText(password)

    if (passwordResult.isLeft()) {
      return left(passwordResult.value)
    }

    const hashedPassword = await this.hashGenerator.generate(password)
    const hashedPasswordVO = Password.create(hashedPassword)

    const user = User.create({
      login: document,
      password: hashedPasswordVO,
    })

    await this.usersRepository.create(user)

    const deliveryDriver = DeliveryDriver.create({
      name,
      document,
      email,
      userId: user.id,
    })

    await this.deliveryDriversRepository.create(deliveryDriver)

    return right({ user })
  }
}
