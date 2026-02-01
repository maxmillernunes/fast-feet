export type StatusOptions =
  | 'CREATED'
  | 'WAITING'
  | 'PICKED_UP'
  | 'DELIVERED'
  | 'RETURNED'

export class OrderStatus {
  public value: StatusOptions

  private constructor(value: StatusOptions) {
    this.value = value
  }

  static create(value: StatusOptions = 'WAITING') {
    return new OrderStatus(value)
  }

  getContent(): StatusOptions {
    return this.value
  }

  /**
   * Valida se a transição para um novo status é permitida.
   * Regra: WAITING -> PICKED_UP -> DELIVERED ou RETURNED
   */
  canTransitionTo(nextStatus: StatusOptions): boolean {
    const transitions: Record<StatusOptions, StatusOptions[]> = {
      CREATED: ['WAITING'],
      WAITING: ['PICKED_UP'],
      PICKED_UP: ['DELIVERED', 'RETURNED'],
      DELIVERED: [], // The final state
      RETURNED: ['WAITING'],
    }

    return transitions[this.value].includes(nextStatus)
  }

  // Métodos auxiliares para facilitar a leitura na Entidade
  isWaiting() {
    return this.value === 'WAITING'
  }
  isPickedUp() {
    return this.value === 'PICKED_UP'
  }
  isDelivered() {
    return this.value === 'DELIVERED'
  }
}
