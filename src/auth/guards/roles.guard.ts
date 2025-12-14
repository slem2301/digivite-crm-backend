import {
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    Injectable,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'

import { UserRole } from 'generated/prisma/client'
import { ROLES_KEY } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()],
        )

        // Если @Roles не используется на методе, доступ открыт
        if (!requiredRoles) return true

        const request = context.switchToHttp().getRequest()
        const user = request.user

        if (!user || !user.role) {
            throw new ForbiddenException('User role not found')
        }

        if (!requiredRoles.includes(user.role)) {
            throw new ForbiddenException('You do not have permission')
        }

        return true
    }
}
