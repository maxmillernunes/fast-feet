import { HashGenerator } from '@/domain/iam/application/cryptography/hash-generator'

export class HashGeneratorInMemory implements HashGenerator {
  async hash(plain: string): Promise<string> {
    return `hashed_${plain}`
  }
}
