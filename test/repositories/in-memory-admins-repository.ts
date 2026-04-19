import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { AdminsRepository } from '@/domain/iam/application/repositories/admins-repository'
import type { Admin } from '@/domain/iam/enterprise/entities/admin'

export class InMemoryAdminsRepository implements AdminsRepository {
  public items: Admin[] = []

  async create(data: Admin): Promise<void> {
    this.items.push(data)
  }

  async findById(id: string): Promise<Admin | null> {
    const admin = this.items.find((admin) =>
      admin.id.equals(new UniqueEntityId(id)),
    )

    if (!admin) {
      return null
    }

    return admin
  }

  async delete(data: Admin): Promise<void> {
    const index = this.items.findIndex((u) => u.id.equals(data.id))

    if (index !== -1) {
      this.items.splice(index, 1)
    }
  }
}
