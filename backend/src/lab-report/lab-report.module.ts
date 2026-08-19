import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LabReport } from './lab-report.entity';
import { Farm } from '../farm/farm.entity';
import { User } from '../auth/user.entity';
import { LabReportService } from './lab-report.service';
import { LabReportController } from './lab-report.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LabReport, Farm, User])],
  controllers: [LabReportController],
  providers: [LabReportService],
  exports: [LabReportService],
})
export class LabReportModule {}
