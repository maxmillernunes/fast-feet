export class Cpf {
  private constructor(readonly value: string) {}

  static create(value: string): boolean {
    return Cpf.validate(value)
  }

  static validate(cpf: string): boolean {
    return /^\d{11}$/.test(cpf)
  }
}
