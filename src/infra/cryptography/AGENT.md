# CRYPTOGRAPHY

Bcrypt e JWT Encrypter para autenticação.

## O QUE CONTÉM

```
cryptography/
├── cryptography.module.ts  # Module de configuração
├── bcrypt-hasher.ts       # Hash de senhas (bcrypt)
└── jwt-encrypter.ts       # Geração de tokens JWT
```

---

## BCRYPT HASHER

Implementa interface de hash do domínio.

### Interface do Domínio

```typescript
// src/domain/iam/application/cryptography/hash-generator.ts
export abstract class HashGenerator {
  abstract generate(plain: string): Promise<string>
}

// src/domain/iam/application/cryptography/hash-comparer.ts
export abstract class HashComparer {
  abstract compare(plain: string, hash: string): Promise<boolean>
}
```

### Implementação

```typescript
// src/infra/cryptography/bcrypt-hasher.ts
export class BcryptHasher implements HashGenerator, HashComparer {
  private HASH_SALT_LENGTH = 8

  async hash(plain: string): Promise<string> {
    return hash(plain, this.HASH_SALT_LENGTH)
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return compare(plain, hash)
  }
}
```

### Uso

```typescript
// No use case de criação de conta
const hash = await this.hashGenerator.generate(password)

// No use case de autenticação
const isValid = await this.hashComparer.compare(password, user.password)
```

---

## JWT ENCRYPTER

Gera tokens JWT para autenticação.

### Interface do Domínio

```typescript
// src/domain/iam/application/cryptography/encrypter.ts
export abstract class Encrypter {
  abstract encrypt(payload: Record<string, unknown>): Promise<string>
}
```

### Implementação

```typescript
// src/infra/cryptography/jwt-encrypter.ts
export class JwtEncrypter implements Encrypter {
  constructor(private envService: EnvService) {}

  async encrypt(payload: Record<string, unknown>): Promise<string> {
    const privateKey = this.envService.get('JWT_PRIVATE_KEY')
    return sign(payload, Buffer.from(privateKey, 'base64'), {
      algorithm: 'RS256',
      expiresIn: '1d',
    })
  }
}
```

### Configuração

| Variável         | Descrição                    |
| ---------------- | ---------------------------- |
| `JWT_PRIVATE_KEY`| Chave privada RSA (base64)  |

---

## CRYPTOGRAPHY MODULE

```typescript
// src/infra/cryptography/cryptography.module.ts
@Module({
  providers: [
    {
      provide: HashGenerator,
      useClass: BcryptHasher,
    },
    {
      provide: HashComparer,
      useClass: BcryptHasher,
    },
    {
      provide: Encrypter,
      useClass: JwtEncrypter,
    },
  ],
  exports: [HashGenerator, HashComparer, Encrypter],
})
export class CryptographyModule {}
```

---

## WORKFLOW COMPLETO

### 1. Criar Conta (Registro)

```
1. Controller recebe dados (name, email, document, password)
2. UseCase valida Document e Password (VOs)
3. BcryptHasher.hash(password) → hash
4. User.create({ password: hash })
5. UsersRepository.create(user)
```

### 2. Autenticar (Login)

```
1. Controller recebe dados (login, password)
2. UsersRepository.findByLogin(login)
3. BcryptHasher.compare(password, user.password)
4. JwtEncrypter.encrypt({ sub: user.id })
5. Controller retorna { access_token }
```

---

## REGRA DE IMPORTAÇÃO

A camada de cryptography implementa interfaces definidas em `domain/cryptography`:

```
domain/        → Define interfaces abstratas
infra/         → Implementa com tecnologia específica (bcrypt, JWT)
```

Nunca o contrário.