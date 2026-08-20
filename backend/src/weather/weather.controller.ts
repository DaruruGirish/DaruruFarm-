import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { WeatherService } from './weather.service';

@ApiTags('Weather')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('weather')
export class WeatherController {
  constructor(private weatherService: WeatherService) {}

  @Get('places')
  @ApiOperation({ summary: 'Search places via Open-Meteo geocoding (server-side)' })
  searchPlaces(@Query('q') q: string) {
    return this.weatherService.searchPlaces(q || '');
  }

  @Get('reverse')
  @ApiOperation({ summary: 'Reverse-geocode coordinates via Open-Meteo (server-side)' })
  reverse(@Query('lat') lat: string, @Query('lng') lng: string) {
    return this.weatherService.reverseGeocode(Number(lat), Number(lng));
  }
}
