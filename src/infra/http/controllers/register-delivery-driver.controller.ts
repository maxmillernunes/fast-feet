import { CurrentUser } from '@/infra/auth/current-user-decorator'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { Controller, Post } from '@nestjs/common'

@Controller('/delivery-drivers')
export class RegisterDeliveryDriverController {
  constructor() {}

  @Post()
  async handle(@CurrentUser() user: UserPayload) {
    return { message: 'Register delivery driver' }
  }
}
