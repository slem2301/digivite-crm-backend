import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma.service';
import { Prisma, UserRole } from 'generated/prisma/client';
import { returnUserObject } from './return-user.object';
import * as bcrypt from 'bcrypt'

@Injectable()
export class UsersService {
	constructor(private prisma: PrismaService) { }

	async findAll(params?: {
		page?: number
		limit?: number
		search?: string
		role?: UserRole
	}) {
		const { page = 1, limit = 10, search, role } = params || {}
		const where: Prisma.UserWhereInput = {}

		if (search) {
			where.OR = [
				{ email: { contains: search, mode: 'insensitive' }, },
				{ name: { contains: search, mode: 'insensitive' }, }
			]
		}
		if (role) {
			where.role = role
		}

		const [items, total] = await this.prisma.$transaction([
			this.prisma.user.findMany({
				where,
				skip: (page - 1) * limit,
				take: limit,
				orderBy: { createdAt: 'desc' },
				select: {
					id: true,
					name: true,
					email: true,
					role: true,
					createdAt: true
				}
			}),
			this.prisma.user.count({ where })
		])
		return {
			items,
			total,
			page,
			limit
		}

	}

	async byId(id: string, selectObject: Prisma.UserSelect = {}) {
		const user = await this.prisma.user.findUnique({
			where: {
				id
			},
			select: {
				...returnUserObject,
				jobs: {
					select: {
						id: true,
						title: true,
						status: true,
						createdAt: true,
					}
				},
				...selectObject
			}
		})

		if (!user) {
			throw new NotFoundException('User not found');
		}

		return user
	}

	async updateProfile(id: string, dto: UpdateUserDto) {
		const isSameUser = await this.prisma.user.findUnique({
			where: { email: dto.email }
		})
		if (isSameUser && id !== isSameUser.id)
			throw new BadRequestException('Email already in use')

		const user = await this.byId(id)

		return this.prisma.user.update({
			where: {
				id
			},
			data: {
				email: dto.email,
				name: dto.name,
				password: dto.password
					? await bcrypt.hash(dto.password, 10)
					: user.password
			}
		})
	}
}
