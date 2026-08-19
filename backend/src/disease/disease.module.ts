import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiseaseEvent } from './disease-event.entity';
import { DiseasePrediction } from './disease-prediction.entity';
import { Farm } from '../farm/farm.entity';
import { GalleryImage } from '../gallery/gallery-image.entity';
import { User } from '../auth/user.entity';
import { DiseaseService } from './disease.service';
import { DiseaseController } from './disease.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DiseaseEvent, DiseasePrediction, Farm, GalleryImage, User])],
  controllers: [DiseaseController],
  providers: [DiseaseService],
  exports: [DiseaseService, TypeOrmModule],
})
export class DiseaseModule {}
