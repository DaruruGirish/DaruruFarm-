import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GalleryImage } from './gallery-image.entity';
import { Farm } from '../farm/farm.entity';
import { User } from '../auth/user.entity';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class GalleryService {
  constructor(
    @InjectRepository(GalleryImage)
    private galleryRepository: Repository<GalleryImage>,
    @InjectRepository(Farm)
    private farmRepository: Repository<Farm>,
  ) {}

  // Save image upload details to database
  async create(filename: string, caption: string, farmId: number | undefined, user: User): Promise<GalleryImage> {
    let farm: Farm | null = null;
    if (farmId) {
      farm = await this.farmRepository.findOne({
        where: { id: farmId, user: { id: user.id } },
      });
      if (!farm) {
        throw new NotFoundException(`Farm with ID ${farmId} not found or unauthorized`);
      }
    }

    const image = this.galleryRepository.create({
      filename,
      caption,
      farm: farm || undefined,
      user,
    });

    return this.galleryRepository.save(image);
  }

  // Get all uploaded images for the user
  async findAll(user: User): Promise<GalleryImage[]> {
    return this.galleryRepository.find({
      where: { user: { id: user.id } },
      relations: { farm: true },
      order: { uploadedAt: 'DESC', id: 'DESC' },
    });
  }

  // Find a specific image
  async findOne(id: number, user: User): Promise<GalleryImage> {
    const image = await this.galleryRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: { farm: true },
    });
    if (!image) {
      throw new NotFoundException(`Image with ID ${id} not found`);
    }
    return image;
  }

  // Delete an image from disk and database
  async remove(id: number, user: User): Promise<void> {
    const image = await this.findOne(id, user);

    // Build absolute path to disk file (Cwd is the backend root)
    const filePath = join(process.cwd(), 'uploads', image.filename);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`Failed to delete file from disk: ${filePath}`, err);
    }

    await this.galleryRepository.remove(image);
  }
}
