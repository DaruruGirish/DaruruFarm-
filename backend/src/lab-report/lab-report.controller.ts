import { Controller, Get, Post, Delete, Param, Request, UseGuards, UseInterceptors, UploadedFile, Body, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { LabReportService } from './lab-report.service';
import { User } from '../auth/user.entity';

@ApiTags('Lab Reports')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('lab-reports')
export class LabReportController {
  constructor(private readonly labReportService: LabReportService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload a soil fertility or pH PDF report' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        title: { type: 'string' },
        category: { type: 'string' },
        notes: { type: 'string' },
        farmId: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_req, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `report-${uniqueSuffix}${extname(file.originalname) || '.pdf'}`);
        },
      }),
      fileFilter: (_req, file, callback) => {
        const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');
        if (!isPdf) {
          return callback(new BadRequestException('Only PDF files are allowed'), false);
        }
        callback(null, true);
      },
      limits: { fileSize: 15 * 1024 * 1024 },
    }),
  )
  upload(
    @UploadedFile() file: any,
    @Body('title') title: string,
    @Body('category') category: string,
    @Body('notes') notes: string,
    @Body('farmId') farmId: string,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('A PDF file is required');
    }
    const kind = category === 'ph' ? 'ph' : category === 'soil' ? 'soil' : '';
    if (!kind) {
      throw new BadRequestException('Category must be soil or ph');
    }
    const reportTitle = (title || '').trim() || file.originalname.replace(/\.pdf$/i, '');
    const user = { id: req.user.id } as User;
    const parsedFarmId = farmId ? parseInt(farmId, 10) : undefined;
    return this.labReportService.create(
      file.filename,
      file.originalname,
      reportTitle,
      kind,
      notes,
      parsedFarmId,
      user,
    );
  }

  @Get()
  findAll(@Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.labReportService.findAll(user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    const user = { id: req.user.id } as User;
    return this.labReportService.remove(+id, user);
  }
}
