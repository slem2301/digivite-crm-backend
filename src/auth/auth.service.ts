import {
	BadRequestException,
	Injectable,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { PrismaService } from 'src/prisma.service'
import { UsersService } from 'src/users/users.service'
import { AuthDto } from './dto/auth.dto'
import { User } from 'generated/prisma/client'
import * as bcrypt from 'bcrypt'
import { faker } from '@faker-js/faker'

@Injectable()
export class AuthService {
	constructor(
		private readonly prisma: PrismaService,
		private readonly jwt: JwtService,
		private readonly usersService: UsersService,
	) { }

	// ======= LOGIN =======
	async login(dto: AuthDto) {
		const user = await this.validateUser(dto)
		const tokens = await this.issueTokens(user.id) // id: string

		return {
			user: this.returnUserFields(user),
			...tokens,
		}
	}

	// ======= REFRESH TOKEN =======
	async getNewTokens(refreshToken: string) {
		let payload: { id: string }

		try {
			payload = await this.jwt.verifyAsync<{ id: string }>(refreshToken)
		} catch {
			throw new UnauthorizedException('Invalid refresh token')
		}

		if (!payload?.id) {
			throw new UnauthorizedException('Invalid refresh token payload')
		}

		const user = await this.usersService.byId(payload.id)

		const tokens = await this.issueTokens(user.id)

		return {
			user: this.returnUserFields(user),
			...tokens,
		}
	}

	// ======= REGISTER =======
	async register(dto: AuthDto) {
		const oldUser = await this.prisma.user.findUnique({
			where: { email: dto.email },
		})

		if (oldUser) {
			throw new BadRequestException('User already exists')
		}

		const hashedPassword = await bcrypt.hash(dto.password, 10)

		const user = await this.prisma.user.create({
			data: {
				email: dto.email,
				password: hashedPassword,

				// name обязателен в схеме, поэтому либо берем из dto, либо генерим
				name: dto.name ?? faker.person.firstName(),

				// role не нужен, т.к. @default(USER) в схеме
				// role: 'USER',
			},
		})

		const tokens = await this.issueTokens(user.id)

		return {
			user: this.returnUserFields(user),
			...tokens,
		}
	}

	// ======= ВЫДАЧА ТОКЕНОВ =======
	private async issueTokens(userId: string) {
		const payload = { id: userId }

		const accessToken = await this.jwt.signAsync(payload, {
			expiresIn: '1h',
		})

		const refreshToken = await this.jwt.signAsync(payload, {
			expiresIn: '7d',
		})

		return { accessToken, refreshToken }
	}

	// ======= ПОЛЯ, КОТОРЫЕ ОТДАЕМ НАРУЖУ =======
	private returnUserFields(user: User) {
		return {
			id: user.id,
			email: user.email,
			name: user.name,
			role: user.role,
			isAdmin: user.role === 'ADMIN', // если в enum есть ADMIN
		}
	}

	// ======= ПРОВЕРКА ПОЛЬЗОВАТЕЛЯ ПРИ ЛОГИНЕ =======
	private async validateUser(dto: AuthDto): Promise<User> {
		const user = await this.prisma.user.findUnique({
			where: { email: dto.email },
		})

		if (!user) {
			throw new NotFoundException('User not found')
		}

		const isValid = await bcrypt.compare(dto.password, user.password)

		if (!isValid) {
			throw new UnauthorizedException('Invalid password')
		}

		return user
	}
}
