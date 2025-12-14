import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UserRole } from 'generated/prisma/client'; // enum из Prisma

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  name: string
}
