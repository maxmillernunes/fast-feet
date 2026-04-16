import { CurrentUser } from '@/infra/auth/current-user-decorator'
import { JwtAuthGuard } from '@/infra/auth/jwt-auth.guard'
import type { UserPayload } from '@/infra/auth/jwt.strategy'
import { Controller, Post, UseGuards } from '@nestjs/common'

@Controller('/delivery-drivers')
@UseGuards(JwtAuthGuard)
export class RegisterDeliveryDriverController {
  constructor() {}

  @Post()
  async handle(@CurrentUser() user: UserPayload) {
    return { message: 'Register delivery driver' }
  }
}
