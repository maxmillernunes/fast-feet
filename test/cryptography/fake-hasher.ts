import { HashComparer } from '@/domain/iam/application/cryptography/hash-comparer'
import { HashGenerator } from '@/domain/iam/application/cryptography/hash-generator'

export class FakeHasher implements HashComparer, HashGenerator {
  async compare(plain: string, hash: string): Promise<boolean> {
    return `hashed_${plain}` === hash
  }

  async hash(plain: string): Promise<string> {
    return `hashed_${plain}`
  }
}
