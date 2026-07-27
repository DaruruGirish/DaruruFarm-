import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GalleryImage } from './gallery-image.entity';
import { Farm } from '../farm/farm.entity';
import { GalleryService } from './gallery.service';
import { GalleryController } from './gallery.controller';

@Module({
  imports: [TypeOrmModule.forFeature([GalleryImage, Farm])],
  controllers: [GalleryController],
  providers: [GalleryService],
  exports: [GalleryService, TypeOrmModule],
})
export class GalleryModule {}
