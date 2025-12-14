import { SetMetadata } from '@nestjs/common'
import { UserRole } from 'generated/prisma/client' // или '@prisma/client', если перейдёшь

export const ROLES_KEY = 'roles'

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles)
