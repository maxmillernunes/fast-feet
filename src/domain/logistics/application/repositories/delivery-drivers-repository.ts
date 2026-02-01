export abstract class DeliveryDriversRepository {
  abstract findById(id: string): Promise<any>
  abstract create(data: any): Promise<void>
}
