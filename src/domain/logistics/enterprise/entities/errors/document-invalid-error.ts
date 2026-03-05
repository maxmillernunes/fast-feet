export class DocumentInvalidError extends Error {
  constructor() {
    super('Invalid document: must be either CPF or CNPJ')
  }
}
