export class InvalidDocumentError extends Error {
  constructor(cpf: string) {
    super(`Invalid CPF format: ${cpf}. CPF must have exactly 11 digits.`)
  }
}
