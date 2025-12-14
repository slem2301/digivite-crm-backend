import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
} from '@nestjs/common'
import { ClientsService } from './clients.service'
import { CreateClientDto } from './dto/create-client.dto'
import { UpdateClientDto } from './dto/update-client.dto'
import { Auth } from 'src/auth/decorators/auth.decorator'
import { Roles } from 'src/auth/decorators/roles.decorator'
import { UserRole } from 'generated/prisma/enums'
import { Admin } from 'src/auth/decorators/admin.decorator'


@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) { }

  @Post()
  @Auth()
  @Roles(UserRole.ADMIN)
  create(@Body() dto: CreateClientDto) {
    return this.clientsService.create(dto)
  }

  @Get()
  @Auth()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.clientsService.findAll({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      search,
    })
  }

  @Get(':id')
  @Auth()
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id)
  }

  @Put(':id')
  @Auth()
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clientsService.update(id, dto)
  }

  @Delete(':id')
  @Auth()
  @Admin()
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id)
  }

  @Get(':id/jobs')
  @Auth() // любой авторизованный может смотреть работы клиента
  getClientWithJobs(@Param('id') id: string) {
    return this.clientsService.findClientJobs(id)
  }
}
