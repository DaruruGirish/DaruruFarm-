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

  @Get('predictions')
  @ApiOperation({ summary: 'List saved vision predictions' })
  findPredictions(@Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.diseaseService.findPredictions(user);
  }

  @Post('predict')
  @ApiOperation({ summary: 'Pomegranate bacterial blight risk from live Open-Meteo weather history' })
  predictBacterialBlight(@Body('farmId') farmId: string, @Request() req: any) {
    const parsed = parseInt(farmId, 10);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException('farmId is required');
    }
    const user = { id: req.user.id } as User;
    return this.diseaseService.predictPomegranateBacterialBlight(parsed, user);
  }

  @Post('analyze-fruit')
  @ApiOperation({ summary: 'Analyze a pomegranate fruit photo (DenseNet121 + Grad-CAM++ + HBDS severity)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
        farmId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(imageUpload)
  analyzeFruit(
    @UploadedFile() file: any,
    @Body('farmId') farmId: string,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }
    const parsedFarmId = farmId ? parseInt(farmId, 10) : NaN;
    const user = { id: req.user.id } as User;
    return this.diseaseService.analyzeFruit(
      file.filename,
      Number.isFinite(parsedFarmId) ? parsedFarmId : null,
      user,
    );
  }

  @Post('analyze-gallery/:id')
  @ApiOperation({ summary: 'Run fruit disease AI on an existing gallery photo' })
  analyzeGallery(@Param('id') id: string, @Request() req: any) {
    const parsed = parseInt(id, 10);
    if (!Number.isFinite(parsed)) {
      throw new BadRequestException('Gallery image id is required');
    }
    const user = { id: req.user.id } as User;
    return this.diseaseService.analyzeGalleryImage(parsed, user);
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
