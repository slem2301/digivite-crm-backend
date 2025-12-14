import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Put,
  UseGuards,
  UsePipes,
  ValidationPipe
} from '@nestjs/common'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import { UsersService } from './users.service'
import { UpdateUserDto } from './dto/update-user.dto'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { UserRole } from 'generated/prisma/enums'
import { AuthGuard } from '@nestjs/passport'
import { RolesGuard } from 'src/auth/guards/roles.guard'


@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Get()
  @Auth()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.usersService.findAll()
  }


  @Get('profile')
  @Auth()
  async getProfile(@CurrentUser('id') id: string) {
    return this.usersService.byId(id)
  }

  @UsePipes(new ValidationPipe())
  @HttpCode(200)
  @Auth()
  @Put('profile')
  async getNewTokens(@CurrentUser('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateProfile(id, dto)
  }


}
