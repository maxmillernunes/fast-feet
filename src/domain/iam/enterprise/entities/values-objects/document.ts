export class Document {
  private constructor(readonly value: string) {}

  static create(value: string): boolean {
    return Document.validate(value)
  }

  static validate(document: string): boolean {
    return /^\d{11}$/.test(document)
  }
}
