import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { UsersService } from 'src/users/users.service'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService, // <-- инжектим сервис
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false, // лучше не игнорировать
      secretOrKey: configService.get<string>('JWT_SECRET'),
    })
  }

  async validate(payload: { id: string }) {
    const user = await this.usersService.byId(payload.id)

    if (!user) {
      // опционально: можно бросить UnauthorizedException
      return null
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    }
  }
}
