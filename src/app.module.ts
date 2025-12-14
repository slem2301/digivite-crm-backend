import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ClientsModule } from './clients/clients.module';
import { JobsModule } from './jobs/jobs.module';
import { AuthModule } from './auth/auth.module';
import { PrismaService } from './prisma.service';
import { ConfigModule } from '@nestjs/config';
import { StatsModule } from './stats/stats.module';

@Module({
  imports: [UsersModule, ClientsModule, JobsModule, AuthModule, ConfigModule.forRoot(), StatsModule,],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule { }
