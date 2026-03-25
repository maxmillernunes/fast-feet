import { HashComparer } from '@/domain/iam/application/cryptography/hash-comparer'

export class HashComparerInMemory implements HashComparer {
  async compare(plain: string, hash: string): Promise<boolean> {
    return `hashed_${plain}` === hash
  }
}
