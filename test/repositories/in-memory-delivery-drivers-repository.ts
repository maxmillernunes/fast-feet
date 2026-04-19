import { UniqueEntityId } from '@/core/entities/unique-entity-id'
import type { PaginationParams } from '@/core/repositories /pagination-params'
import type { DeliveryDriversRepository } from '@/domain/iam/application/repositories/delivery-drivers-repository'
import type { DeliveryDriver } from '@/domain/iam/enterprise/entities/delivery-driver'

export class InMemoryDeliveryDriversRepository implements DeliveryDriversRepository {
  public items: DeliveryDriver[] = []

  async create(data: DeliveryDriver): Promise<void> {
    this.items.push(data)
  }

  async findByDocument(document: string): Promise<DeliveryDriver | null> {
    const driver = this.items.find((driver) => driver.document === document)

    if (!driver) {
      return null
    }

    return driver
  }

  async findByEmail(email: string): Promise<DeliveryDriver | null> {
    const driver = this.items.find((driver) => driver.email === email)

    if (!driver) {
      return null
    }

    return driver
  }

  async findById(id: string): Promise<DeliveryDriver | null> {
    const driver = this.items.find(
      (driver) => driver.id.equals(new UniqueEntityId(id)) && !driver.isDeleted,
    )

    if (!driver) {
      return null
    }

    return driver
  }

  async findMany({
    page,
    perPage,
  }: PaginationParams): Promise<DeliveryDriver[]> {
    const active = this.items.filter((u) => !u.isDeleted)
    const start = (page - 1) * perPage
    const end = start + perPage

    return active.slice(start, end)
  }

  async count(): Promise<number> {
    return this.items.filter((u) => !u.isDeleted).length
  }

  async save(driver: DeliveryDriver): Promise<void> {
    const index = this.items.findIndex((u) => u.id.equals(driver.id))

    if (index !== -1) {
      this.items[index] = driver
    }
  }

  async delete(driver: DeliveryDriver): Promise<void> {
    const index = this.items.findIndex((u) => u.id.equals(driver.id))

    if (index !== -1) {
      this.items.splice(index, 1)
    }
  }
}
