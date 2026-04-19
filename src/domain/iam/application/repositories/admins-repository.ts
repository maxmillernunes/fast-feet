import type { Admin } from '../../enterprise/entities/admin'

export abstract class AdminsRepository {
  abstract create(data: Admin): Promise<void>
  abstract findById(id: string): Promise<Admin | null>
  abstract delete(data: Admin): Promise<void>
}
