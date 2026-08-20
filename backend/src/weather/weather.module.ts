import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Farm } from '../farm/farm.entity';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { WeatherSnapshot } from './weather-snapshot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([WeatherSnapshot, Farm])],
  controllers: [WeatherController],
  providers: [WeatherService],
  exports: [WeatherService],
})
export class WeatherModule {}
