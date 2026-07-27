import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiseaseEvent } from './disease-event.entity';
import { Farm } from '../farm/farm.entity';
import { DiseaseService } from './disease.service';
import { DiseaseController } from './disease.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DiseaseEvent, Farm])],
  controllers: [DiseaseController],
  providers: [DiseaseService],
  exports: [DiseaseService, TypeOrmModule],
})
export class DiseaseModule {}
