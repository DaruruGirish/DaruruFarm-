import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyActivity } from './daily-activity.entity';
import { Farm } from '../farm/farm.entity';
import { User } from '../auth/user.entity';
import { DailyActivityService } from './daily-activity.service';
import { DailyActivityController } from './daily-activity.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DailyActivity, Farm, User])],
  controllers: [DailyActivityController],
  providers: [DailyActivityService],
  exports: [DailyActivityService, TypeOrmModule],
})
export class DailyActivityModule {}
