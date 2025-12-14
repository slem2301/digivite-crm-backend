import {
    IsDateString,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    MinLength,
} from 'class-validator'
import { JobStatus } from 'generated/prisma/client' // или '@prisma/client'

export class CreateJobDto {
    @IsString()
    @MinLength(2)
    title: string

    @IsOptional()
    @IsString()
    description?: string

    @IsOptional()
    @IsNumber()
    price?: number

    @IsOptional()
    @IsDateString()
    scheduledAt?: string

    @IsString()
    clientId: string

    @IsOptional()
    @IsString()
    assignedToId?: string

    @IsOptional()
    @IsEnum(JobStatus)
    status?: JobStatus
}
