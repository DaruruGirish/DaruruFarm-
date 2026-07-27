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

  @Post('upload')
  @ApiOperation({ summary: 'Log a new crop disease incident with image and weather parameters' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
        diseaseName: { type: 'string' },
        temp: { type: 'number' },
        humidity: { type: 'number' },
        rainfall: { type: 'number' },
        farmId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Disease incident logged successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid file format.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `disease-${uniqueSuffix}${ext}`);
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(new BadRequestException('Only image files (jpg, jpeg, png, gif, webp) are allowed!'), false);
        }
        callback(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
  )
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
      throw new BadRequestException('Disease image is required');
    }
    if (!diseaseName || !temp || !humidity || !farmId) {
      throw new BadRequestException('Disease name, temperature, humidity, and farm ID are required');
    }

    const user = { id: req.user.id } as User;
    return this.diseaseService.create(
      file.filename,
      diseaseName,
      parseFloat(temp),
      parseInt(humidity),
      rainfall ? parseFloat(rainfall) : 0,
      parseInt(farmId),
      user,
    );
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
