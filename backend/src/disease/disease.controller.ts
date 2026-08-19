import { Controller, Get, Post, Delete, Param, Request, UseGuards, UseInterceptors, UploadedFile, Body, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DiseaseService } from './disease.service';
import { User } from '../auth/user.entity';

@ApiTags('Disease Management')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('disease-management')
export class DiseaseController {
  constructor(private readonly diseaseService: DiseaseService) {}

  @Post('predict')
  @ApiOperation({ summary: 'Predict disease risk based on telemetry data' })
  @ApiResponse({ status: 200, description: 'Risk prediction result' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async predictRisk(
    @Body() data: {
      rainfall_mm: number;
      humidity: number;
      temperature: number;
      recent_disease_count?: number;
      recent_high_severity_count?: number;
      irrigation_liters?: number;
      pesticide_spray_count?: number;
      disease_log_count?: number;
      pest_inspection_count?: number;
    },
    @Request() req: any,
  ) {
    const user = { id: req.user.id } as User;
    // service method does not use user, but could be extended for auth
    return this.diseaseService.predictDiseaseRisk(data);
  }


  @Get()
  @ApiOperation({ summary: 'Get all logged crop diseases' })
  @ApiResponse({ status: 200, description: 'List of crop diseases retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.diseaseService.findAll(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a crop disease incident' })
  @ApiResponse({ status: 200, description: 'Incident deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Incident not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  remove(@Param('id') id: string, @Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.diseaseService.remove(+id, user);
  }
}
