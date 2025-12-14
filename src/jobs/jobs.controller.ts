import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common'
import { JobsService } from './jobs.service'
import { CreateJobDto } from './dto/create-job.dto'
import { UpdateJobDto } from './dto/update-job.dto'
import { ChangeStatusDto } from './dto/change-status.dto'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Admin } from 'src/auth/decorators/admin.decorator'
import { CurrentUser } from 'src/auth/decorators/user.decorator'
import type { User } from 'generated/prisma/client'
import { AssignJobDto } from './dto/assign-job.dto'

@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) { }

  @Get()
  @Auth()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('clientId') clientId?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('search') search?: string,
    @CurrentUser() user?: User,
  ) {
    return this.jobsService.findAll(
      {
        page: page ? Number(page) : 1,
        limit: limit ? Number(limit) : 10,
        status,
        clientId,
        assignedToId,
        search,
      },
      user!,
    )
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.jobsService.findOne(id, user)
  }

  @Post()
  @Auth()
  create(@Body() dto: CreateJobDto, @CurrentUser() user: User) {
    return this.jobsService.create(dto, user)
  }

  @Put(':id')
  @Auth()
  update(
    @Param('id') id: string,
    @Body() dto: UpdateJobDto,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.update(id, dto, user)
  }

  @Put(':id/status')
  @Admin()
  changeStatus(
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.changeStatus(id, dto, user)
  }

  @Delete(':id')
  @Admin()
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.jobsService.remove(id, user)
  }


  @Put(':id/assign')
  @Admin()
  assign(
    @Param('id') id: string,
    @Body() dto: AssignJobDto,
    @CurrentUser() user: User,
  ) {
    return this.jobsService.assignToUser(id, dto, user)
  }

  @Put(':id/unassign')
  @Admin()
  unassign(@Param('id') id: string, @CurrentUser() user: User) {
    return this.jobsService.unassignFromUser(id, user)
  }
}
