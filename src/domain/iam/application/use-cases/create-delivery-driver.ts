import { Either, left, right } from '@/core/either'
import { NotAllowedError } from '@/core/errors/errors/not-allowed-error'
import { InvalidCpfError } from '../../enterprise/errors/invalid-cpf-error'
import { UserAlreadyExistsError } from '../../enterprise/errors/user-already-exists-error'
import { InvalidPasswordError } from '../../enterprise/errors/invalid-password-error'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'
import { Password } from '../../enterprise/entities/values-objects/password'
import { Cpf } from '../../enterprise/entities/values-objects/cpf'
import { UsersRepository } from '../repositories/users-repository'
import { HashGenerator } from '../cryptography/hash-generator'
import { User } from '../../enterprise/entities/user'

interface CreateDeliveryDriverRequest {
  userId: string
  name: string
  cpf: string
  password: string
}

type CreateDeliveryDriverResponse = Either<
  | NotAllowedError
  | InvalidCpfError
  | UserAlreadyExistsError
  | InvalidPasswordError,
  { user: User }
>

export class CreateDeliveryDriverUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute({
    userId,
    name,
    cpf,
    password,
  }: CreateDeliveryDriverRequest): Promise<CreateDeliveryDriverResponse> {
    const currentUser = await this.usersRepository.findById(userId)
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      return left(new NotAllowedError())
    }

    if (!Cpf.validate(cpf)) {
      return left(new InvalidCpfError(cpf))
    }

    const existingUser = await this.usersRepository.findByCpf(cpf)
    if (existingUser) {
      return left(new UserAlreadyExistsError(cpf))
    }

    const passwordResult = Password.create(password)
    if (passwordResult.isLeft()) {
      return left(passwordResult.value)
    }

    const hashedPassword = await this.hashGenerator.generate(password)
    const hashedPasswordVO = Password.createWithoutValidation(hashedPassword)

    const user = User.create({
      name,
      cpf,
      role: UserRole.DELIVERY_DRIVER,
      password: hashedPasswordVO,
    })

    await this.usersRepository.create(user)

    return right({ user })
  }
}
