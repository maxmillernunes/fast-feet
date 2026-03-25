import { HashGenerator } from '@/domain/iam/application/cryptography/hash-generator'

export class HashGeneratorInMemory implements HashGenerator {
  async generate(plain: string): Promise<string> {
    return `hashed_${plain}`
  }
}
