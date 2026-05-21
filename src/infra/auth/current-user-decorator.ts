import { createParamDecorator, type ExecutionContext } from '@nestjs/common'
import type { RequestWithUser } from './permission-user-decorator'

export const CurrentUser = createParamDecorator(
  (_: never, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<RequestWithUser>()

    return request.user
  },
)
