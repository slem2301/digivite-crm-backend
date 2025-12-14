import { UserRole } from 'generated/prisma/client';

export class UserResponseDto {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}
