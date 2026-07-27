import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyActivity } from './daily-activity.entity';
import { Farm } from '../farm/farm.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { User } from '../auth/user.entity';

@Injectable()
export class DailyActivityService {
  constructor(
    @InjectRepository(DailyActivity)
    private dailyActivityRepository: Repository<DailyActivity>,
    @InjectRepository(Farm)
    private farmRepository: Repository<Farm>,
  ) {}

  // Log a daily activity
  async create(createActivityDto: CreateActivityDto, user: User): Promise<DailyActivity> {
    const farm = await this.farmRepository.findOne({
      where: { id: createActivityDto.farmId, user: { id: user.id } },
    });
    if (!farm) {
      throw new NotFoundException(`Farm with ID ${createActivityDto.farmId} not found or unauthorized`);
    }

    const dailyActivity = this.dailyActivityRepository.create({
      date: createActivityDto.date,
      activityType: createActivityDto.activityType,
      notes: createActivityDto.notes,
      pesticideName: createActivityDto.pesticideName,
      pesticideQuantity: createActivityDto.pesticideQuantity,
      pesticideTime: createActivityDto.pesticideTime,
      farm,
      user,
    });

    return this.dailyActivityRepository.save(dailyActivity);
  }

  // Get all logged activities for the user
  async findAll(user: User): Promise<DailyActivity[]> {
    return this.dailyActivityRepository.find({
      where: { user: { id: user.id } },
      relations: { farm: true },
      order: { date: 'DESC', id: 'DESC' },
    });
  }

  // Find a specific logged activity
  async findOne(id: number, user: User): Promise<DailyActivity> {
    const activity = await this.dailyActivityRepository.findOne({
      where: { id, user: { id: user.id } },
      relations: { farm: true },
    });
    if (!activity) {
      throw new NotFoundException(`Activity log with ID ${id} not found`);
    }
    return activity;
  }

  // Update a daily activity
  async update(id: number, updateActivityDto: UpdateActivityDto, user: User): Promise<DailyActivity> {
    const activity = await this.findOne(id, user);

    if (updateActivityDto.farmId !== undefined) {
      const farm = await this.farmRepository.findOne({
        where: { id: updateActivityDto.farmId, user: { id: user.id } },
      });
      if (!farm) {
        throw new NotFoundException(`Farm with ID ${updateActivityDto.farmId} not found or unauthorized`);
      }
      activity.farm = farm;
    }

    if (updateActivityDto.date !== undefined) {
      activity.date = updateActivityDto.date;
    }
    if (updateActivityDto.activityType !== undefined) {
      activity.activityType = updateActivityDto.activityType;
    }
    if (updateActivityDto.notes !== undefined) {
      activity.notes = updateActivityDto.notes;
    }
    if (updateActivityDto.pesticideName !== undefined) {
      activity.pesticideName = updateActivityDto.pesticideName;
    }
    if (updateActivityDto.pesticideQuantity !== undefined) {
      activity.pesticideQuantity = updateActivityDto.pesticideQuantity;
    }
    if (updateActivityDto.pesticideTime !== undefined) {
      activity.pesticideTime = updateActivityDto.pesticideTime;
    }

    return this.dailyActivityRepository.save(activity);
  }

  // Delete a daily activity
  async remove(id: number, user: User): Promise<void> {
    const activity = await this.findOne(id, user);
    await this.dailyActivityRepository.remove(activity);
  }
}
