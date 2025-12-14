import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { PrismaService } from 'src/prisma.service';
import { UsersService } from 'src/users/users.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from 'src/users/users.module';
import { getJwtConfig } from 'src/config/jwt.config';

@Module({
  controllers: [AuthController],
  providers: [AuthService,
    JwtStrategy, PrismaService, UsersService
  ],
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getJwtConfig
    }),
    UsersModule
  ]
})
export class AuthModule { }


