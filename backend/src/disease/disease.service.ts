import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DiseaseEvent } from './disease-event.entity';
import { Farm } from '../farm/farm.entity';
import { User } from '../auth/user.entity';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class DiseaseService {
  constructor(
    @InjectRepository(DiseaseEvent)
    private diseaseRepository: Repository<DiseaseEvent>,
    @InjectRepository(Farm)
    private farmRepository: Repository<Farm>,
  ) {}

  // Log a new crop disease incident
  async create(
    filename: string,
    diseaseName: string,
    temp: number,
    humidity: number,
    rainfall: number,
    farmId: number,
    user: User,
  ): Promise<DiseaseEvent> {
    const farm = await this.farmRepository.findOne({
      where: { id: farmId, user: { id: user.id } },
    });
    if (!farm) {
      throw new NotFoundException(`Farm with ID ${farmId} not found or unauthorized`);
    }

    const event = this.diseaseRepository.create({
      filename,
      diseaseName,
      temp,
      humidity,
      rainfall,
      farm,
      user,
    });

    return this.diseaseRepository.save(event);
  }

  // Get all logged disease incidents for the user
  async findAll(user: User): Promise<DiseaseEvent[]> {
    return this.diseaseRepository.find({
      where: { user: { id: user.id } },
      relations: { farm: true },
      order: { detectedAt: 'DESC', id: 'DESC' },
    });
  }

  // Find a specific incident
  async findOne(id: number, user: User): Promise<DiseaseEvent> {
    const event = await this.diseaseRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: { farm: true },
    });
    if (!event) {
      throw new NotFoundException(`Disease incident with ID ${id} not found`);
    }
    return event;
  }

  // Delete an incident and its photo from disk
  async remove(id: number, user: User): Promise<void> {
    const event = await this.findOne(id, user);

    // Build absolute path to disk file
    const filePath = join(process.cwd(), 'uploads', event.filename);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`Failed to delete disease file from disk: ${filePath}`, err);
    }

    await this.diseaseRepository.remove(event);
  }
}
