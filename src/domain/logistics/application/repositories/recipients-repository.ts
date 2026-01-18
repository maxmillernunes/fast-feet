export abstract class RecipientsRepository {
  abstract findById(id: string): Promise<any>
  abstract create(data: any): Promise<void>
}
