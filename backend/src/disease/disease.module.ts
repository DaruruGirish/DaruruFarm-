import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiseaseEvent } from './disease-event.entity';
import { DiseasePrediction } from './disease-prediction.entity';
import { Farm } from '../farm/farm.entity';
import { User } from '../auth/user.entity';
import { DiseaseService } from './disease.service';
import { DiseaseController } from './disease.controller';
import { PomegranateFruitPipelineService } from './pomegranate-fruit-pipeline.service';
import { WeatherModule } from '../weather/weather.module';
import { GalleryModule } from '../gallery/gallery.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DiseaseEvent, DiseasePrediction, Farm, User]),
    WeatherModule,
    GalleryModule,
  ],
  controllers: [DiseaseController],
  providers: [DiseaseService, PomegranateFruitPipelineService],
  exports: [DiseaseService, TypeOrmModule],
})
export class DiseaseModule {}
