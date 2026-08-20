import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LabReport } from './lab-report.entity';
import { Farm } from '../farm/farm.entity';
import { User } from '../auth/user.entity';
import { userHasPremium } from '../auth/plan';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class LabReportService {
  constructor(
    @InjectRepository(LabReport)
    private labReportRepository: Repository<LabReport>,
    @InjectRepository(Farm)
    private farmRepository: Repository<Farm>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    filename: string,
    originalName: string,
    title: string,
    category: string,
    notes: string | undefined,
    farmId: number | undefined,
    user: User,
  ): Promise<LabReport> {
    const owner = await this.userRepository.findOne({ where: { id: user.id } });
    if (!userHasPremium(owner)) {
      throw new ForbiddenException('Lab report uploads are a Premium feature (₹5,000/year).');
    }
    let farm: Farm | null = null;
    if (farmId) {
      farm = await this.farmRepository.findOne({
        where: { id: farmId, user: { id: user.id } },
      });
      if (!farm) {
        throw new NotFoundException('Farm not found');
      }
    }

    const report = this.labReportRepository.create({
      filename,
      originalName,
      title,
      category,
      notes,
      farm,
      user,
    });
    return this.labReportRepository.save(report);
  }

  findAll(user: User): Promise<LabReport[]> {
    return this.labReportRepository.find({
      where: { user: { id: user.id } },
      relations: { farm: true },
      order: { uploadedAt: 'DESC', id: 'DESC' },
    });
  }

  async findOne(id: number, user: User): Promise<LabReport> {
    const report = await this.labReportRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: { farm: true },
    });
    if (!report) {
      throw new NotFoundException('Lab report not found');
    }
    return report;
  }

  async remove(id: number, user: User): Promise<void> {
    const report = await this.findOne(id, user);
    const filePath = join(process.cwd(), 'uploads', report.filename);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      console.error(`Failed to delete report file: ${filePath}`, err);
    }
    await this.labReportRepository.remove(report);
  }
}
