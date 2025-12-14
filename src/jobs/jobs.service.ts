import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { CreateJobDto } from './dto/create-job.dto'
import { UpdateJobDto } from './dto/update-job.dto'
import { ChangeStatusDto } from './dto/change-status.dto'
import { Prisma, UserRole } from 'generated/prisma/client'
import { AssignJobDto } from './dto/assign-job.dto'

type CurrentUser = { id: string; role: UserRole }

@Injectable()
export class JobsService {
  constructor(private readonly prisma: PrismaService) { }

  // ───── CREATE ─────
  async create(dto: CreateJobDto, user: CurrentUser) {
    const { scheduledAt, ...rest } = dto

    // пока user здесь не используем, но параметр есть на будущее
    return this.prisma.job.create({
      data: {
        ...rest,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
      include: {
        client: true,
        assignedTo: true,
      },
    })
  }

  // ───── FIND ALL (с фильтрацией по роли) ─────
  async findAll(
    params: {
      page?: number
      limit?: number
      status?: string
      clientId?: string
      assignedToId?: string
      search?: string
    },
    user: CurrentUser,
  ) {
    const {
      page = 1,
      limit = 10,
      status,
      clientId,
      assignedToId,
      search,
    } = params

    const where: Prisma.JobWhereInput = {}

    if (status) where.status = status as any
    if (clientId) where.clientId = clientId

    // ADMIN может фильтровать по assignedToId,
    // USER всегда видит только свои задачи
    if (user.role === UserRole.USER) {
      where.assignedToId = user.id
    } else if (assignedToId) {
      where.assignedToId = assignedToId
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.job.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          client: true,
          assignedTo: true,
        },
      }),
      this.prisma.job.count({ where }),
    ])

    return {
      items,
      total,
      page,
      limit,
    }
  }

  // ───── FIND ONE (с проверкой доступа) ─────
  async findOne(id: string, user: CurrentUser) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        client: true,
        assignedTo: true,
      },
    })

    if (!job) throw new NotFoundException('Job not found')

    if (user.role === UserRole.USER && job.assignedToId !== user.id) {
      throw new ForbiddenException('You cannot view this job')
    }

    return job
  }

  // ───── UPDATE (ограничения для USER) ─────
  async update(id: string, dto: UpdateJobDto, user: CurrentUser) {
    const job = await this.ensureExists(id)

    if (user.role === UserRole.USER && job.assignedToId !== user.id) {
      throw new ForbiddenException('You cannot edit this job')
    }

    // USER не может переназначать задачу
    if (user.role === UserRole.USER && (dto as any).assignedToId) {
      delete (dto as any).assignedToId
    }

    const { scheduledAt, ...rest } = dto

    return this.prisma.job.update({
      where: { id },
      data: {
        ...rest,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      },
      include: {
        client: true,
        assignedTo: true,
      },
    })
  }

  // ───── CHANGE STATUS (доп. защита, хотя у тебя уже @Admin) ─────
  async changeStatus(id: string, dto: ChangeStatusDto, user: CurrentUser) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can change job status')
    }

    await this.ensureExists(id)

    return this.prisma.job.update({
      where: { id },
      data: { status: dto.status },
      include: {
        client: true,
        assignedTo: true,
      },
    })
  }

  // ───── REMOVE (только ADMIN) ─────
  async remove(id: string, user: CurrentUser) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can delete jobs')
    }

    await this.ensureExists(id)

    return this.prisma.job.delete({
      where: { id },
    })
  }


  // НАЗНАЧИТЬ ЗАДАЧУ ПОЛЬЗОВАТЕЛЮ
  async assignToUser(id: string, dto: AssignJobDto, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can assign jobs')
    }

    const job = await this.ensureExists(id)

    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true },
    })

    if (!user) {
      throw new NotFoundException('User not found')
    }

    return this.prisma.job.update({
      where: { id: job.id },
      data: {
        assignedToId: user.id,
      },
      include: {
        client: true,
        assignedTo: true,
      },
    })
  }

  // СНЯТЬ ЗАДАЧУ С ПОЛЬЗОВАТЕЛЯ (оставить без исполнителя)
  async unassignFromUser(id: string, currentUser: CurrentUser) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can unassign jobs')
    }

    const job = await this.ensureExists(id)

    return this.prisma.job.update({
      where: { id: job.id },
      data: {
        assignedToId: null,
      },
      include: {
        client: true,
        assignedTo: true,
      },
    })
  }

  private async ensureExists(id: string) {
    const job = await this.prisma.job.findUnique({ where: { id } })
    if (!job) throw new NotFoundException('Job not found')
    return job
  }
}
