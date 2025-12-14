// decorators/auth.decorator.ts
import { UseGuards, applyDecorators } from '@nestjs/common'
import { JwtAuthGuard } from '../guards/jwt.guard'
import { RolesGuard } from '../guards/roles.guard'

export const Auth = () =>
	applyDecorators(UseGuards(JwtAuthGuard, RolesGuard))
