import { Controller, Get, Post, Delete, Param, Request, UseGuards, UseInterceptors, UploadedFile, Body, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DiseaseService } from './disease.service';
import { User } from '../auth/user.entity';

const imageUpload = FileInterceptor('image', {
  storage: diskStorage({
    destination: './uploads',
    filename: (_req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname);
      callback(null, `disease-${uniqueSuffix}${ext}`);
    },
  }),
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
      return callback(new BadRequestException('Only image files (jpg, jpeg, png, gif, webp) are allowed!'), false);
    }
    callback(null, true);
  },
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});

@ApiTags('Disease Management')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('disease-management')
export class DiseaseController {
  constructor(private readonly diseaseService: DiseaseService) {}

  @Post('predict')
  @ApiOperation({ summary: 'Predict disease outbreak risk from weather telemetry' })
  @ApiResponse({ status: 200, description: 'Risk prediction result' })
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
  ) {
    return this.diseaseService.predictDiseaseRisk(data);
  }

  @Post('vision/:plantPart')
  @ApiOperation({ summary: 'Classify a pomegranate leaf or fruit photo with EfficientNet' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(imageUpload)
  async predictVision(
    @Param('plantPart') plantPart: string,
    @UploadedFile() file: any,
    @Body('farmId') farmId: string,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const user = { id: req.user.id } as User;
    const parsedFarmId = farmId ? parseInt(farmId, 10) : undefined;
    return this.diseaseService.predictFromUpload(file.filename, plantPart, parsedFarmId, user);
  }

  @Post('vision-gallery/:id')
  @ApiOperation({ summary: 'Run disease detection on an existing gallery photo' })
  async predictGallery(
    @Param('id') id: string,
    @Body() body: { plantPart: string; farmId?: number },
    @Request() req: any,
  ) {
    const user = { id: req.user.id } as User;
    return this.diseaseService.predictFromGallery(+id, body.plantPart, body.farmId, user);
  }

  @Get('predictions')
  @ApiOperation({ summary: 'List saved vision predictions' })
  findPredictions(@Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.diseaseService.findPredictions(user);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Log a crop disease incident with photo and weather' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
        diseaseName: { type: 'string' },
        temp: { type: 'string' },
        humidity: { type: 'string' },
        rainfall: { type: 'string' },
        farmId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(imageUpload)
  uploadFile(
    @UploadedFile() file: any,
    @Body('diseaseName') diseaseName: string,
    @Body('temp') temp: string,
    @Body('humidity') humidity: string,
    @Body('rainfall') rainfall: string,
    @Body('farmId') farmId: string,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const user = { id: req.user.id } as User;
    return this.diseaseService.create(
      file.filename,
      diseaseName,
      parseFloat(temp),
      parseInt(humidity, 10),
      parseFloat(rainfall),
      parseInt(farmId, 10),
      user,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all logged crop diseases' })
  findAll(@Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.diseaseService.findAll(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a crop disease incident' })
  remove(@Param('id') id: string, @Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.diseaseService.remove(+id, user);
  }
}
