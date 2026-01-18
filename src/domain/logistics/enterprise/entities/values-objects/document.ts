import { Either, left, right } from '@/core/either'

export class Document {
  private readonly value: string
  private readonly type: 'CPF' | 'CNPJ'

  private constructor(value: string, type: 'CPF' | 'CNPJ') {
    this.value = value
    this.type = type
  }

  public getValue(): string {
    return this.value
  }

  public getType(): 'CPF' | 'CNPJ' {
    return this.type
  }

  static format(doc: string): string {
    return doc.replace(/\D/g, '')
  }

  static create(rawDocument: string): Either<Error, Document> {
    const documentFormatted = this.format(rawDocument)

    if (documentFormatted.length === 11) {
      return right(new Document(documentFormatted, 'CPF'))
    }

    if (documentFormatted.length === 14) {
      return right(new Document(documentFormatted, 'CNPJ'))
    }

    return left(new Error('Invalid document: must be either CPF or CNPJ'))
  }
}
