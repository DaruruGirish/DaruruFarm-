import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Expense } from '../expense/expense.entity';
import { DailyActivity } from '../daily-activity/daily-activity.entity';
import { DiseaseEvent } from '../disease/disease-event.entity';
import { Farm } from '../farm/farm.entity';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [TypeOrmModule.forFeature([Expense, DailyActivity, DiseaseEvent, Farm]), WeatherModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
