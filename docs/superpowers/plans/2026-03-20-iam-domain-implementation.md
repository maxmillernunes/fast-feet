# IAM Domain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o domínio IAM completo com User, Password VO, autenticação e CRUD de entregadores

**Architecture:** Domínio isolado seguindo padrão DDD, com contratos (interfaces) em application/ e implementações em enterprise/. Use cases orquestram lógica usando repositórios e serviços injetados.

**Tech Stack:** TypeScript, Node.js (sem infra HTTP ainda)

---

## File Structure

```
src/domain/iam/
├── enterprise/
│   ├── entities/
│   │   ├── user.ts
│   │   └── values-objects/
│   │       └── user-role.ts
│   ├── errors/
│   │   ├── invalid-cpf-error.ts
│   │   ├── invalid-password-error.ts
│   │   ├── user-already-exists-error.ts
│   │   ├── user-not-found-error.ts
│   │   └── invalid-credentials-error.ts
│   └── value-objects/
│       └── password.ts
├── application/
│   ├── cryptography/
│   │   ├── hash-generator.ts
│   │   └── hash-comparer.ts
│   ├── repositories/
│   │   └── users-repository.ts
│   └── use-cases/
│       ├── authenticate.ts
│       ├── authenticate.spec.ts
│       ├── create-delivery-driver.ts
│       ├── create-delivery-driver.spec.ts
│       ├── get-delivery-driver.ts
│       ├── get-delivery-driver.spec.ts
│       ├── list-delivery-drivers.ts
│       ├── list-delivery-drivers.spec.ts
│       ├── update-delivery-driver.ts
│       ├── update-delivery-driver.spec.ts
│       ├── delete-delivery-driver.ts
│       └── delete-delivery-driver.spec.ts

test/
├── repositories/
│   └── in-memory-users-repository.ts
├── cryptography/
│   ├── hash-generator-in-memory.ts
│   └── hash-comparer-in-memory.ts
└── factories/
    └── make-user.ts
```

---

## Dependency Order

1. Task 1: Value Objects e Errors (sem dependências)
2. Task 2: Entity User (usa VO e errors)
3. Task 3: Contracts (hash-generator, hash-comparer, users-repository com count)
4. **Task 4: Test Infrastructure** (In-Memory Repository, cryptography in-memory, factories) - DEVE vir antes dos use cases
5. Task 5: Authenticate use case
6. Task 6: CreateDeliveryDriver use case
7. Task 7: GetDeliveryDriver use case
8. Task 8: ListDeliveryDrivers use case
9. Task 9: UpdateDeliveryDriver use case
10. Task 10: DeleteDeliveryDriver use case
11. Task 11: Documentation (AGENT.md)

---

## Tasks

### Task 1: Value Objects e Errors Base

**Files:**

- Create: `src/domain/iam/enterprise/errors/invalid-cpf-error.ts`
- Create: `src/domain/iam/enterprise/errors/invalid-password-error.ts`
- Create: `src/domain/iam/enterprise/errors/user-already-exists-error.ts`
- Create: `src/domain/iam/enterprise/errors/user-not-found-error.ts`
- Create: `src/domain/iam/enterprise/errors/invalid-credentials-error.ts`
- Create: `src/domain/iam/enterprise/value-objects/password.ts`

- [ ] **Step 1: Create InvalidCpfError**

```typescript
export class InvalidCpfError extends Error {
  constructor(cpf: string) {
    super(`Invalid CPF format: ${cpf}. CPF must have exactly 11 digits.`)
    this.name = 'InvalidCpfError'
  }
}
```

- [ ] **Step 2: Create InvalidPasswordError**

```typescript
export class InvalidPasswordError extends Error {
  constructor() {
    super(
      'Invalid password. Password must be at least 8 characters with 1 uppercase letter, 1 number, and 1 special character.',
    )
    this.name = 'InvalidPasswordError'
  }
}
```

- [ ] **Step 3: Create UserAlreadyExistsError**

```typescript
export class UserAlreadyExistsError extends Error {
  constructor(cpf: string) {
    super(`User with CPF ${cpf} already exists.`)
    this.name = 'UserAlreadyExistsError'
  }
}
```

- [ ] **Step 4: Create UserNotFoundError**

```typescript
export class UserNotFoundError extends Error {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`)
    this.name = 'UserNotFoundError'
  }
}
```

- [ ] **Step 5: Create InvalidCredentialsError**

```typescript
export class InvalidCredentialsError extends Error {
  constructor() {
    super('Invalid credentials.')
    this.name = 'InvalidCredentialsError'
  }
}
```

- [ ] **Step 6: Create Password Value Object**

```typescript
import { Either, left, right } from '@/core/either'
import { InvalidPasswordError } from '../errors/invalid-password-error'

export class Password {
  private constructor(private readonly hash: string) {}

  get value(): string {
    return this.hash
  }

  static create(plain: string): Either<InvalidPasswordError, Password> {
    if (!Password.validate(plain)) {
      return left(new InvalidPasswordError())
    }
    return right(new Password(plain))
  }

  static validate(plain: string): boolean {
    if (plain.length < 8) return false
    if (!/[A-Z]/.test(plain)) return false
    if (!/[0-9]/.test(plain)) return false
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(plain)) return false
    return true
  }

  static createWithoutValidation(hash: string): Password {
    return new Password(hash)
  }

  compare(plain: string, hashedPlain: string): boolean {
    return `hashed_${plain}` === hashedPlain
  }
}
```

---

### Task 2: Entity User

**Files:**

- Create: `src/domain/iam/enterprise/entities/values-objects/user-role.ts`
- Create: `src/domain/iam/enterprise/entities/user.ts`

- [ ] **Step 1: Create UserRole VO**

```typescript
export enum UserRole {
  ADMIN = 'ADMIN',
  DELIVERY_DRIVER = 'DELIVERY_DRIVER',
}
```

- [ ] **Step 2: Create User Entity**

```typescript
import { Entity } from '@/core/entities/entity'
import type { UniqueEntityId } from '@/core/entities/unique-entity-id'
import { UserRole } from './values-objects/user-role'
import { Password } from '../value-objects/password'
import type { Optional } from '@/core/types/optional'

export interface UserProps {
  name: string
  cpf: string
  role: UserRole
  password: Password
  createdAt: Date
  updatedAt?: Date
  deletedAt?: Date
}

export class User extends Entity<UserProps> {
  get name(): string {
    return this.props.name
  }

  get cpf(): string {
    return this.props.cpf
  }

  get role(): UserRole {
    return this.props.role
  }

  get password(): Password {
    return this.props.password
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date | undefined {
    return this.props.updatedAt
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== undefined
  }

  private touch(): void {
    this.props.updatedAt = new Date()
  }

  set name(name: string) {
    this.props.name = name
    this.touch()
  }

  set password(password: Password) {
    this.props.password = password
    this.touch()
  }

  delete(): void {
    this.props.deletedAt = new Date()
    this.touch()
  }

  static create(
    props: Optional<UserProps, 'createdAt' | 'updatedAt' | 'deletedAt'>,
    id?: UniqueEntityId,
  ): User {
    return new User(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
      },
      id,
    )
  }
}
```

---

### Task 3: Contracts (Interfaces)

**Files:**

- Create: `src/domain/iam/application/cryptography/hash-generator.ts`
- Create: `src/domain/iam/application/cryptography/hash-comparer.ts`
- Create: `src/domain/iam/application/repositories/users-repository.ts`

- [ ] **Step 1: Create HashGenerator interface**

```typescript
export abstract class HashGenerator {
  abstract generate(plain: string): Promise<string>
}
```

- [ ] **Step 2: Create HashComparer interface**

```typescript
export abstract class HashComparer {
  abstract compare(plain: string, hash: string): Promise<boolean>
}
```

- [ ] **Step 3: Create UsersRepository interface (with count method)**

```typescript
import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { User } from '../../enterprise/entities/user'

export abstract class UsersRepository {
  abstract findById(id: string): Promise<User | null>
  abstract findByCpf(cpf: string): Promise<User | null>
  abstract findMany(params: PaginationParams): Promise<User[]>
  abstract count(): Promise<number>
  abstract create(user: User): Promise<void>
  abstract save(user: User): Promise<void>
  abstract delete(user: User): Promise<void>
}
```

---

### Task 4: Test Infrastructure

**Files:**

- Create: `test/cryptography/hash-generator-in-memory.ts`
- Create: `test/cryptography/hash-comparer-in-memory.ts`
- Create: `test/repositories/in-memory-users-repository.ts`
- Create: `test/factories/make-user.ts`

- [ ] **Step 1: Create HashGeneratorInMemory**

```typescript
import { HashGenerator } from '@/domain/iam/application/cryptography/hash-generator'

export class HashGeneratorInMemory implements HashGenerator {
  async generate(plain: string): Promise<string> {
    return `hashed_${plain}`
  }
}
```

- [ ] **Step 2: Create HashComparerInMemory**

```typescript
import { HashComparer } from '@/domain/iam/application/cryptography/hash-comparer'

export class HashComparerInMemory implements HashComparer {
  async compare(plain: string, hash: string): Promise<boolean> {
    return `hashed_${plain}` === hash
  }
}
```

- [ ] **Step 3: Create InMemoryUsersRepository**

```typescript
import type { PaginationParams } from '@/core/repositories/pagination-params'
import type { UsersRepository } from '@/domain/iam/application/repositories/users-repository'
import { User } from '@/domain/iam/enterprise/entities/user'

export class InMemoryUsersRepository implements UsersRepository {
  public users: User[] = []

  async findById(id: string): Promise<User | null> {
    return (
      this.users.find((u) => u.id.toString() === id && !u.isDeleted) ?? null
    )
  }

  async findByCpf(cpf: string): Promise<User | null> {
    return this.users.find((u) => u.cpf === cpf && !u.isDeleted) ?? null
  }

  async findMany({ page, perPage }: PaginationParams): Promise<User[]> {
    const active = this.users.filter((u) => !u.isDeleted)
    const start = (page - 1) * perPage
    const end = start + perPage
    return active.slice(start, end)
  }

  async count(): Promise<number> {
    return this.users.filter((u) => !u.isDeleted).length
  }

  async create(user: User): Promise<void> {
    this.users.push(user)
  }

  async save(user: User): Promise<void> {
    const index = this.users.findIndex((u) => u.id.equals(user.id))
    if (index !== -1) {
      this.users[index] = user
    }
  }

  async delete(user: User): Promise<void> {
    const index = this.users.findIndex((u) => u.id.equals(user.id))
    if (index !== -1) {
      this.users.splice(index, 1)
    }
  }
}
```

- [ ] **Step 4: Create makeUser factory**

```typescript
import { User } from '@/domain/iam/enterprise/entities/user'
import { UserRole } from '@/domain/iam/enterprise/entities/values-objects/user-role'
import { Password } from '@/domain/iam/enterprise/value-objects/password'
import type { UserProps } from '@/domain/iam/enterprise/entities/user'
import { UniqueEntityId } from '@/core/entities/unique-entity-id'

export function makeUser(
  override: Partial<UserProps> = {},
  id?: UniqueEntityId,
): User {
  const validPassword = Password.createWithoutValidation(
    'hashed_valid_password',
  )
  return User.create(
    {
      name: override.name ?? 'John Doe',
      cpf: override.cpf ?? '12345678901',
      role: override.role ?? UserRole.DELIVERY_DRIVER,
      password: override.password ?? validPassword,
      ...override,
    },
    id,
  )
}
```

---

### Task 5: Use Cases - Authenticate

**Files:**

- Create: `src/domain/iam/application/use-cases/authenticate.ts`
- Create: `src/domain/iam/application/use-cases/authenticate.spec.ts`

- [ ] **Step 1: Write Authenticate use case test**

```typescript
import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@/test/repositories/in-memory-users-repository'
import { HashComparerInMemory } from '@/test/cryptography/hash-comparer-in-memory'
import { makeUser } from '@/test/factories/make-user'
import { AuthenticateUseCase } from './authenticate'
import { InvalidCredentialsError } from '../../enterprise/errors/invalid-credentials-error'

let usersRepository: InMemoryUsersRepository
let hashComparer: HashComparerInMemory
let sut: AuthenticateUseCase

describe('AuthenticateUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    hashComparer = new HashComparerInMemory()
    sut = new AuthenticateUseCase(usersRepository, hashComparer)
  })

  it('should authenticate a user with valid credentials', async () => {
    const user = makeUser({ cpf: '12345678901' })
    await usersRepository.create(user)

    const result = await sut.execute({
      cpf: '12345678901',
      password: 'ValidPass123!',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.cpf).toBe('12345678901')
    }
  })

  it('should return error for invalid CPF', async () => {
    const result = await sut.execute({
      cpf: '00000000000',
      password: 'ValidPass123!',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCredentialsError)
    }
  })

  it('should return error for invalid password', async () => {
    const user = makeUser({ cpf: '12345678901' })
    await usersRepository.create(user)

    const result = await sut.execute({
      cpf: '12345678901',
      password: 'WrongPass123!',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCredentialsError)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- authenticate.spec.ts`
Expected: FAIL with "AuthenticateUseCase not found"

- [ ] **Step 3: Implement AuthenticateUseCase**

```typescript
import { Either, left, right } from '@/core/either'
import { InvalidCredentialsError } from '../../enterprise/errors/invalid-credentials-error'
import type { UsersRepository } from '../repositories/users-repository'
import type { HashComparer } from '../cryptography/hash-comparer'
import { User } from '../../enterprise/entities/user'

interface AuthenticateInput {
  cpf: string
  password: string
}

type AuthenticateOutput = Either<InvalidCredentialsError, { user: User }>

export class AuthenticateUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashComparer: HashComparer,
  ) {}

  async execute(input: AuthenticateInput): Promise<AuthenticateOutput> {
    const user = await this.usersRepository.findByCpf(input.cpf)

    if (!user) {
      return left(new InvalidCredentialsError())
    }

    const isPasswordValid = await this.hashComparer.compare(
      input.password,
      user.password.value,
    )

    if (!isPasswordValid) {
      return left(new InvalidCredentialsError())
    }

    return right({ user })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- authenticate.spec.ts`
Expected: PASS

---

### Task 6: Use Cases - CreateDeliveryDriver

**Files:**

- Create: `src/domain/iam/application/use-cases/create-delivery-driver.ts`
- Create: `src/domain/iam/application/use-cases/create-delivery-driver.spec.ts`

- [ ] **Step 1: Write CreateDeliveryDriver use case test**

```typescript
import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@/test/repositories/in-memory-users-repository'
import { HashGeneratorInMemory } from '@/test/cryptography/hash-generator-in-memory'
import { CreateDeliveryDriverUseCase } from './create-delivery-driver'
import { InvalidCpfError } from '../../enterprise/errors/invalid-cpf-error'
import { UserAlreadyExistsError } from '../../enterprise/errors/user-already-exists-error'
import { InvalidPasswordError } from '../../enterprise/errors/invalid-password-error'

let usersRepository: InMemoryUsersRepository
let hashGenerator: HashGeneratorInMemory
let sut: CreateDeliveryDriverUseCase

describe('CreateDeliveryDriverUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    hashGenerator = new HashGeneratorInMemory()
    sut = new CreateDeliveryDriverUseCase(usersRepository, hashGenerator)
  })

  it('should create a delivery driver with valid data', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      cpf: '12345678901',
      password: 'ValidPass123!',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.name).toBe('John Doe')
      expect(result.value.user.cpf).toBe('12345678901')
    }
  })

  it('should return error when CPF already exists', async () => {
    await usersRepository.create(makeUser({ cpf: '12345678901' }))

    const result = await sut.execute({
      name: 'John Doe',
      cpf: '12345678901',
      password: 'ValidPass123!',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserAlreadyExistsError)
    }
  })

  it('should return error for invalid password', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      cpf: '12345678901',
      password: 'weak',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidPasswordError)
    }
  })

  it('should return error for invalid CPF format', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      cpf: '123', // invalid CPF
      password: 'ValidPass123!',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidCpfError)
    }
  })

  it('should hash the password', async () => {
    const result = await sut.execute({
      name: 'John Doe',
      cpf: '12345678901',
      password: 'ValidPass123!',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.password.value).toBe('hashed_ValidPass123!')
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- create-delivery-driver.spec.ts`
Expected: FAIL with "CreateDeliveryDriverUseCase not found"

- [ ] **Step 3: Implement CreateDeliveryDriverUseCase**

```typescript
import { Either, left, right } from '@/core/either'
import { InvalidCpfError } from '../../enterprise/errors/invalid-cpf-error'
import { UserAlreadyExistsError } from '../../enterprise/errors/user-already-exists-error'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'
import { Password } from '../../enterprise/value-objects/password'
import type { UsersRepository } from '../repositories/users-repository'
import type { HashGenerator } from '../cryptography/hash-generator'
import { User } from '../../enterprise/entities/user'

interface CreateDeliveryDriverInput {
  name: string
  cpf: string
  password: string
}

type CreateDeliveryDriverOutput = Either<
  InvalidCpfError | UserAlreadyExistsError | InvalidPasswordError,
  { user: User }
>

export class CreateDeliveryDriverUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute(
    input: CreateDeliveryDriverInput,
  ): Promise<CreateDeliveryDriverOutput> {
    if (!this.isValidCpf(input.cpf)) {
      return left(new InvalidCpfError(input.cpf))
    }

    const existingUser = await this.usersRepository.findByCpf(input.cpf)
    if (existingUser) {
      return left(new UserAlreadyExistsError(input.cpf))
    }

    const passwordResult = Password.create(input.password)
    if (passwordResult.isLeft()) {
      return left(passwordResult.value)
    }

    const hashedPassword = await this.hashGenerator.generate(input.password)
    const password = Password.createWithoutValidation(hashedPassword)

    const user = User.create({
      name: input.name,
      cpf: input.cpf,
      role: UserRole.DELIVERY_DRIVER,
      password,
    })

    await this.usersRepository.create(user)

    return right({ user })
  }

  private isValidCpf(cpf: string): boolean {
    return /^\d{11}$/.test(cpf)
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- create-delivery-driver.spec.ts`
Expected: PASS

---

### Task 7: Use Cases - GetDeliveryDriver

**Files:**

- Create: `src/domain/iam/application/use-cases/get-delivery-driver.ts`
- Create: `src/domain/iam/application/use-cases/get-delivery-driver.spec.ts`

- [ ] **Step 1: Write GetDeliveryDriver use case test**

```typescript
import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@/test/repositories/in-memory-users-repository'
import { GetDeliveryDriverUseCase } from './get-delivery-driver'
import { makeUser } from '@/test/factories/make-user'
import { UserNotFoundError } from '../../enterprise/errors/user-not-found-error'

let usersRepository: InMemoryUsersRepository
let sut: GetDeliveryDriverUseCase

describe('GetDeliveryDriverUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new GetDeliveryDriverUseCase(usersRepository)
  })

  it('should return a delivery driver by id', async () => {
    const user = makeUser({ cpf: '12345678901' })
    await usersRepository.create(user)

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.cpf).toBe('12345678901')
    }
  })

  it('should return error when user not found', async () => {
    const result = await sut.execute({ userId: 'non-existent-id' })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should not return deleted users', async () => {
    const user = makeUser({ cpf: '12345678901' })
    await usersRepository.create(user)
    user.delete()
    await usersRepository.save(user)

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- get-delivery-driver.spec.ts`
Expected: FAIL with "GetDeliveryDriverUseCase not found"

- [ ] **Step 3: Implement GetDeliveryDriverUseCase**

```typescript
import { Either, left, right } from '@/core/either'
import { UserNotFoundError } from '../../enterprise/errors/user-not-found-error'
import type { UsersRepository } from '../repositories/users-repository'
import { User } from '../../enterprise/entities/user'

interface GetDeliveryDriverInput {
  userId: string
}

type GetDeliveryDriverOutput = Either<UserNotFoundError, { user: User }>

export class GetDeliveryDriverUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute(
    input: GetDeliveryDriverInput,
  ): Promise<GetDeliveryDriverOutput> {
    const user = await this.usersRepository.findById(input.userId)

    if (!user) {
      return left(new UserNotFoundError(input.userId))
    }

    return right({ user })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- get-delivery-driver.spec.ts`
Expected: PASS

---

### Task 8: Use Cases - ListDeliveryDrivers

**Files:**

- Create: `src/domain/iam/application/use-cases/list-delivery-drivers.ts`
- Create: `src/domain/iam/application/use-cases/list-delivery-drivers.spec.ts`

- [ ] **Step 1: Write ListDeliveryDrivers use case test**

```typescript
import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@/test/repositories/in-memory-users-repository'
import { ListDeliveryDriversUseCase } from './list-delivery-drivers'
import { makeUser } from '@/test/factories/make-user'

let usersRepository: InMemoryUsersRepository
let sut: ListDeliveryDriversUseCase

describe('ListDeliveryDriversUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new ListDeliveryDriversUseCase(usersRepository)
  })

  it('should return a paginated list of delivery drivers', async () => {
    for (let i = 1; i <= 25; i++) {
      await usersRepository.create(
        makeUser({ cpf: `1234567890${i}`.padStart(11, '0') }),
      )
    }

    const result = await sut.execute({ page: 1, perPage: 10 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.users).toHaveLength(10)
      expect(result.value.total).toBe(25)
      expect(result.value.page).toBe(1)
      expect(result.value.perPage).toBe(10)
    }
  })

  it('should return empty list when no users', async () => {
    const result = await sut.execute({ page: 1, perPage: 10 })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.users).toHaveLength(0)
      expect(result.value.total).toBe(0)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- list-delivery-drivers.spec.ts`
Expected: FAIL with "ListDeliveryDriversUseCase not found"

- [ ] **Step 3: Implement ListDeliveryDriversUseCase**

```typescript
import type { UsersRepository } from '../repositories/users-repository'
import { User } from '../../enterprise/entities/user'

interface ListDeliveryDriversInput {
  page: number
  perPage: number
}

interface ListDeliveryDriversOutput {
  users: User[]
  total: number
  page: number
  perPage: number
}

export class ListDeliveryDriversUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute(
    input: ListDeliveryDriversInput,
  ): Promise<ListDeliveryDriversOutput> {
    const [users, total] = await Promise.all([
      this.usersRepository.findMany({
        page: input.page,
        perPage: input.perPage,
      }),
      this.usersRepository.count(),
    ])

    return {
      users,
      total,
      page: input.page,
      perPage: input.perPage,
    }
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- list-delivery-drivers.spec.ts`
Expected: PASS

---

### Task 9: Use Cases - UpdateDeliveryDriver

**Files:**

- Create: `src/domain/iam/application/use-cases/update-delivery-driver.ts`
- Create: `src/domain/iam/application/use-cases/update-delivery-driver.spec.ts`

- [ ] **Step 1: Write UpdateDeliveryDriver use case test**

```typescript
import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@/test/repositories/in-memory-users-repository'
import { HashGeneratorInMemory } from '@/test/cryptography/hash-generator-in-memory'
import { UpdateDeliveryDriverUseCase } from './update-delivery-driver'
import { makeUser } from '@/test/factories/make-user'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'
import { UserNotFoundError } from '../../enterprise/errors/user-not-found-error'
import { InvalidPasswordError } from '../../enterprise/errors/invalid-password-error'

let usersRepository: InMemoryUsersRepository
let hashGenerator: HashGeneratorInMemory
let sut: UpdateDeliveryDriverUseCase

describe('UpdateDeliveryDriverUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    hashGenerator = new HashGeneratorInMemory()
    sut = new UpdateDeliveryDriverUseCase(usersRepository, hashGenerator)
  })

  it('should update delivery driver name', async () => {
    const user = makeUser({ name: 'Old Name' })
    await usersRepository.create(user)

    const result = await sut.execute({
      userId: user.id.toString(),
      name: 'New Name',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.name).toBe('New Name')
    }
  })

  it('should update delivery driver password', async () => {
    const user = makeUser()
    await usersRepository.create(user)

    const result = await sut.execute({
      userId: user.id.toString(),
      password: 'NewPass123!',
    })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.password.value).toBe('hashed_NewPass123!')
    }
  })

  it('should return error when user not found', async () => {
    const result = await sut.execute({
      userId: 'non-existent-id',
      name: 'New Name',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should return error for invalid password', async () => {
    const user = makeUser()
    await usersRepository.create(user)

    const result = await sut.execute({
      userId: user.id.toString(),
      password: 'weak',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidPasswordError)
    }
  })

  it('should return error when trying to update an admin', async () => {
    const admin = makeUser({ role: UserRole.ADMIN })
    await usersRepository.create(admin)

    const result = await sut.execute({
      userId: admin.id.toString(),
      name: 'New Name',
    })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- update-delivery-driver.spec.ts`
Expected: FAIL with "UpdateDeliveryDriverUseCase not found"

- [ ] **Step 3: Implement UpdateDeliveryDriverUseCase**

```typescript
import { Either, left, right } from '@/core/either'
import { UserNotFoundError } from '../../enterprise/errors/user-not-found-error'
import { InvalidPasswordError } from '../../enterprise/errors/invalid-password-error'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'
import { Password } from '../../enterprise/value-objects/password'
import type { UsersRepository } from '../repositories/users-repository'
import type { HashGenerator } from '../cryptography/hash-generator'
import { User } from '../../enterprise/entities/user'

interface UpdateDeliveryDriverInput {
  userId: string
  name?: string
  password?: string
}

type UpdateDeliveryDriverOutput = Either<
  UserNotFoundError | InvalidPasswordError,
  { user: User }
>

export class UpdateDeliveryDriverUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private hashGenerator: HashGenerator,
  ) {}

  async execute(
    input: UpdateDeliveryDriverInput,
  ): Promise<UpdateDeliveryDriverOutput> {
    const user = await this.usersRepository.findById(input.userId)

    if (!user || user.role !== UserRole.DELIVERY_DRIVER) {
      return left(new UserNotFoundError(input.userId))
    }

    if (input.name) {
      user.name = input.name
    }

    if (input.password) {
      const passwordResult = Password.create(input.password)
      if (passwordResult.isLeft()) {
        return left(passwordResult.value)
      }

      const hashedPassword = await this.hashGenerator.generate(input.password)
      user.password = Password.createWithoutValidation(hashedPassword)
    }

    await this.usersRepository.save(user)

    return right({ user })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- update-delivery-driver.spec.ts`
Expected: PASS

---

### Task 10: Use Cases - DeleteDeliveryDriver

**Files:**

- Create: `src/domain/iam/application/use-cases/delete-delivery-driver.ts`
- Create: `src/domain/iam/application/use-cases/delete-delivery-driver.spec.ts`

- [ ] **Step 1: Write DeleteDeliveryDriver use case test**

```typescript
import { beforeEach, describe, it, expect } from 'vitest'
import { InMemoryUsersRepository } from '@/test/repositories/in-memory-users-repository'
import { DeleteDeliveryDriverUseCase } from './delete-delivery-driver'
import { makeUser } from '@/test/factories/make-user'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'
import { UserNotFoundError } from '../../enterprise/errors/user-not-found-error'

let usersRepository: InMemoryUsersRepository
let sut: DeleteDeliveryDriverUseCase

describe('DeleteDeliveryDriverUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository()
    sut = new DeleteDeliveryDriverUseCase(usersRepository)
  })

  it('should soft delete a delivery driver', async () => {
    const user = makeUser()
    await usersRepository.create(user)

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.user.isDeleted).toBe(true)
    }

    const deletedUser = await usersRepository.findById(user.id.toString())
    expect(deletedUser?.isDeleted).toBe(true)
  })

  it('should return error when user not found', async () => {
    const result = await sut.execute({ userId: 'non-existent-id' })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should return error when user already deleted', async () => {
    const user = makeUser()
    await usersRepository.create(user)
    user.delete()
    await usersRepository.save(user)

    const result = await sut.execute({ userId: user.id.toString() })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })

  it('should return error when trying to delete an admin', async () => {
    const admin = makeUser({ role: UserRole.ADMIN })
    await usersRepository.create(admin)

    const result = await sut.execute({ userId: admin.id.toString() })

    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(UserNotFoundError)
    }
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- delete-delivery-driver.spec.ts`
Expected: FAIL with "DeleteDeliveryDriverUseCase not found"

- [ ] **Step 3: Implement DeleteDeliveryDriverUseCase**

```typescript
import { Either, left, right } from '@/core/either'
import { UserNotFoundError } from '../../enterprise/errors/user-not-found-error'
import { UserRole } from '../../enterprise/entities/values-objects/user-role'
import type { UsersRepository } from '../repositories/users-repository'
import { User } from '../../enterprise/entities/user'

interface DeleteDeliveryDriverInput {
  userId: string
}

type DeleteDeliveryDriverOutput = Either<UserNotFoundError, { user: User }>

export class DeleteDeliveryDriverUseCase {
  constructor(private usersRepository: UsersRepository) {}

  async execute(
    input: DeleteDeliveryDriverInput,
  ): Promise<DeleteDeliveryDriverOutput> {
    const user = await this.usersRepository.findById(input.userId)

    if (!user || user.role !== UserRole.DELIVERY_DRIVER) {
      return left(new UserNotFoundError(input.userId))
    }

    user.delete()
    await this.usersRepository.save(user)

    return right({ user })
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- delete-delivery-driver.spec.ts`
Expected: PASS

---

### Task 11: Documentation

**Files:**

- Create: `src/domain/iam/AGENT.md`

- [ ] **Step 1: Create AGENT.md with pattern documentation**

Seguir o padrão dos outros AGENT.md com:

- Visão geral do domínio
- Entidades e seus comportamentos
- Use cases disponíveis
- Padrões de validação
- Exemplos de código

---

## Resumo dos Use Cases

| Use Case             | Input                    | Output              | Erros Possíveis                              |
| -------------------- | ------------------------ | ------------------- | -------------------------------------------- |
| Authenticate         | cpf, password            | User                | InvalidCredentialsError                      |
| CreateDeliveryDriver | name, cpf, password      | User                | InvalidPasswordError, UserAlreadyExistsError |
| GetDeliveryDriver    | userId                   | User                | UserNotFoundError                            |
| ListDeliveryDrivers  | page, perPage            | User[] + pagination | -                                            |
| UpdateDeliveryDriver | userId, name?, password? | User                | UserNotFoundError, InvalidPasswordError      |
| DeleteDeliveryDriver | userId                   | User                | UserNotFoundError                            |

---

## Validações de Password

| Regra              | Validação                       |
| ------------------ | ------------------------------- |
| Comprimento mínimo | 8 caracteres                    |
| Maiúscula          | Pelo menos 1 letra A-Z          |
| Número             | Pelo menos 1 dígito 0-9         |
| Especial           | Pelo menos 1 caractere especial |
