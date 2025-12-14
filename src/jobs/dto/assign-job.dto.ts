import { IsString } from 'class-validator'

export class AssignJobDto {
    @IsString()
    userId: string
}
