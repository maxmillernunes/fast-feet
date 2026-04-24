import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  mixin,
  Type,
  Injectable,
} from '@nestjs/common'
import { Request } from 'express'
import { UsersRepository } from '@/domain/iam/application/repositories/users-repository'

// Define os tipos de roles possíveis na sua aplicação
type RoleType = 'ADMIN' | 'DRIVER'

interface RequestWithUser extends Request {
  user: {
    sub: string // ID do usuário no JWT
    [key: string]: any
  }
}

export const RequireRoles = (
  ...requiredRoles: RoleType[]
): Type<CanActivate> => {
  @Injectable()
  class RoleGuard implements CanActivate {
    constructor(private usersRepository: UsersRepository) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest() as RequestWithUser
      const user = request.user

      if (!user) {
        throw new ForbiddenException({
          title: 'Não autorizado!',
          message: 'Você precisa estar autenticado para acessar este recurso.',
          code: 'unauthorized',
        })
      }

      // Buscar usuário do banco de dados
      const userFromDB = await this.usersRepository.findById(user.sub)

      if (!userFromDB) {
        throw new ForbiddenException({
          title: 'Não autorizado!',
          message: 'Usuário não encontrado.',
          code: 'user_not_found',
        })
      }

      // Se não há roles requeridas, permite acesso
      if (requiredRoles.length === 0) {
        return true
      }

      // Verifica se o usuário tem alguma das roles necessárias
      const hasRequiredRole = requiredRoles.includes(
        userFromDB.role as RoleType,
      )

      if (!hasRequiredRole) {
        throw new ForbiddenException({
          title: 'Não autorizado!',
          message: 'Você não possui permissões suficientes para essa operação.',
          code: 'forbidden',
        })
      }

      return true
    }
  }

  return mixin(RoleGuard)
}
