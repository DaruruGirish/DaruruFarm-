import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Expense } from '../expense/expense.entity';
import { DailyActivity } from '../daily-activity/daily-activity.entity';
import { DiseaseEvent } from '../disease/disease-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, DailyActivity, DiseaseEvent])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
