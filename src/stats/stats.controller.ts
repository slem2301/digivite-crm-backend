import { Controller, Get } from '@nestjs/common'
import { StatsService } from './stats.service'
import { Admin } from 'src/auth/decorators/admin.decorator'

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) { }

  @Get('overview')
  @Admin() // только админ
  getOverview() {
    return this.statsService.getOverview()
  }

  @Get('jobs-by-user')
  @Admin()
  getJobsByUser() {
    return this.statsService.getJobsByUser()
  }
}
