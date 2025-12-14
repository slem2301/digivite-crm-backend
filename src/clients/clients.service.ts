import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'
import { Prisma } from 'generated/prisma/client'

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreateClientDto) {
    return this.prisma.client.create({
      data: dto,
    })
  }

  async findAll(params: { page?: number; limit?: number; search?: string }) {
    const { page = 1, limit = 10, search } = params

    const where: Prisma.ClientWhereInput = search
      ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ],
      }
      : {}

    const [items, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.count({ where }),
    ])

    return {
      items,
      total,
      page,
      limit,
    }
  }

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
    })

    if (!client) throw new NotFoundException('Client not found')

    return client
  }

  async update(id: string, dto: UpdateClientDto) {
    await this.findOne(id) // кинет 404, если нет

    return this.prisma.client.update({
      where: { id },
      data: dto,
    })
  }

  async remove(id: string) {
    await this.findOne(id)

    // Важно: если на клиента завязаны Job, удаление может не пройти
    // потом надо в схеме сделать onDelete
    return this.prisma.client.delete({
      where: { id },
    })
  }



  async findClientJobs(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
        jobs: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: true,
          },
        },
      },
    })

    if (!client) {
      throw new NotFoundException('Client not found')
    }

    return client
  }

}
