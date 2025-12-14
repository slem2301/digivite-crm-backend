import { IsEnum } from 'class-validator'
import { JobStatus } from 'generated/prisma/client'

export class ChangeStatusDto {
    @IsEnum(JobStatus)
    status: JobStatus
}
