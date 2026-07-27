import { Controller, Get, Post, Delete, Param, Request, UseGuards, UseInterceptors, UploadedFile, Body, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { GalleryService } from './gallery.service';
import { User } from '../auth/user.entity';

@ApiTags('Gallery')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a daily farm image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
        caption: { type: 'string' },
        farmId: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid file format.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          callback(null, `farm-${uniqueSuffix}${ext}`);
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
    @Body('caption') caption: string,
    @Body('farmId') farmId: string,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const user = { id: req.user.id } as User;
    const parsedFarmId = farmId ? parseInt(farmId) : undefined;
    return this.galleryService.create(file.filename, caption, parsedFarmId, user);
  }

  @Get()
  @ApiOperation({ summary: 'Get all gallery images' })
  @ApiResponse({ status: 200, description: 'List of images retrieved.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAll(@Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.galleryService.findAll(user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a gallery image' })
  @ApiResponse({ status: 200, description: 'Image deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Image not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  remove(@Param('id') id: string, @Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.galleryService.remove(+id, user);
  }
}
