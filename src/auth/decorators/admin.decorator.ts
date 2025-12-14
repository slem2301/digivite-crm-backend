// decorators/admin.decorator.ts
import { applyDecorators } from '@nestjs/common'
import { Auth } from './auth.decorator'
import { Roles } from './roles.decorator'
import { UserRole } from 'generated/prisma/client'

export const Admin = () =>
    applyDecorators(Auth(), Roles(UserRole.ADMIN))
