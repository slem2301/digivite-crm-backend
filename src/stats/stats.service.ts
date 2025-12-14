import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma.service'
import { JobStatus } from 'generated/prisma/client'

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) { }

  async getOverview() {
    const [usersCount, clientsCount, jobsCount, rawJobsByStatus, lastJobs] =
      await this.prisma.$transaction([
        this.prisma.user.count(),
        this.prisma.client.count(),
        this.prisma.job.count(),
        this.prisma.job.groupBy({
          by: ['status'],
          _count: { _all: true },      // ВАЖНО: не `true`, а объект
          orderBy: { status: 'asc' },
        }),
        this.prisma.job.findMany({
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            client: true,
            assignedTo: true,
          },
        }),
      ])

    // Явно подсказываем TS, какого типа строки groupBy
    type JobsByStatusRow = {
      status: JobStatus
      _count: { _all: number }
    }

    const jobsByStatus = rawJobsByStatus as JobsByStatusRow[]

    const jobsByStatusMap: Record<JobStatus, number> = {
      NEW: 0,
      SCHEDULED: 0,
      IN_PROGRESS: 0,
      DONE: 0,
      CANCELLED: 0,
    }

    for (const item of jobsByStatus) {
      jobsByStatusMap[item.status] = item._count._all
    }

    return {
      usersCount,
      clientsCount,
      jobsCount,
      jobsByStatus: jobsByStatusMap,
      lastJobs,
    }
  }


  async getJobsByUser() {
    const grouped = await this.prisma.job.groupBy({
      by: ['assignedToId'],
      _count: {
        _all: true,
      },
      orderBy: {
        assignedToId: 'asc',
      },
    })

    if (!grouped.length) {
      return {
        users: [],
        unassignedJobs: 0,
      }
    }

    const unassignedRow = grouped.find((row) => row.assignedToId === null)
    const assignedRows = grouped.filter((row) => row.assignedToId !== null)

    const userIds = assignedRows
      .map((row) => row.assignedToId)
      .filter((id): id is string => Boolean(id))

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    })

    const usersWithCounts = assignedRows.map((row) => {
      const user = users.find((u) => u.id === row.assignedToId)

      return {
        userId: row.assignedToId,
        name: user?.name ?? 'Unknown',
        email: user?.email ?? null,
        role: user?.role ?? null,
        jobsCount: row._count._all,
      }
    })

    return {
      users: usersWithCounts,
      unassignedJobs: unassignedRow?._count._all ?? 0,
    }
  }

}
