export class InvalidCpfError extends Error {
  constructor(cpf: string) {
    super(`Invalid CPF format: ${cpf}. CPF must have exactly 11 digits.`)
  }
}
