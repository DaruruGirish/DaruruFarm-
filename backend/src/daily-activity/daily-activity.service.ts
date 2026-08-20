import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyActivity } from './daily-activity.entity';
import { Farm } from '../farm/farm.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { User } from '../auth/user.entity';
import { assertPremiumAccess } from '../auth/premium-access';
import { userHasPremium } from '../auth/plan';

function isPesticideActivity(input: {
  activityType?: string;
  pesticideName?: string | null;
}) {
  return (
    input.activityType === 'Pesticide Application' ||
    Boolean(input.pesticideName && input.pesticideName !== 'None')
  );
}

function isWaterSupplyActivity(input: { activityType?: string }) {
  return input.activityType === 'Water Supply';
}

@Injectable()
export class DailyActivityService {
  constructor(
    @InjectRepository(DailyActivity)
    private dailyActivityRepository: Repository<DailyActivity>,
    @InjectRepository(Farm)
    private farmRepository: Repository<Farm>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private async requirePremium(userId: number, featureLabel: string) {
    const owner = await this.userRepository.findOne({ where: { id: userId } });
    assertPremiumAccess(owner, featureLabel);
  }

  // Log a daily activity
  async create(createActivityDto: CreateActivityDto, user: User): Promise<DailyActivity> {
    if (isPesticideActivity(createActivityDto)) {
      await this.requirePremium(user.id, 'Pesticide logs');
    }
    if (isWaterSupplyActivity(createActivityDto)) {
      const hours = Number(createActivityDto.waterHours);
      if (!Number.isFinite(hours) || hours <= 0) {
        throw new BadRequestException('Enter how many hours of water were supplied.');
      }
    }
    const farm = await this.farmRepository.findOne({
      where: { id: createActivityDto.farmId, user: { id: user.id } },
    });
    if (!farm) {
      throw new NotFoundException(`Farm with ID ${createActivityDto.farmId} not found or unauthorized`);
    }

    const waterHours =
      createActivityDto.waterHours != null && Number.isFinite(Number(createActivityDto.waterHours))
        ? Number(createActivityDto.waterHours)
        : null;

    const dailyActivity = this.dailyActivityRepository.create({
      date: createActivityDto.date,
      activityType: createActivityDto.activityType,
      notes: createActivityDto.notes || (isWaterSupplyActivity(createActivityDto)
        ? `Water supplied for ${waterHours} hour${Number(waterHours) === 1 ? '' : 's'}.`
        : ''),
      pesticideName: createActivityDto.pesticideName,
      pesticideQuantity: createActivityDto.pesticideQuantity,
      pesticideTime: createActivityDto.pesticideTime,
      waterHours,
      farm,
      user,
    });

    return this.dailyActivityRepository.save(dailyActivity);
  }

  // Get all logged activities for the user
  async findAll(user: User): Promise<DailyActivity[]> {
    const owner = await this.userRepository.findOne({ where: { id: user.id } });
    const rows = await this.dailyActivityRepository.find({
      where: { user: { id: user.id } },
      relations: { farm: true },
      order: { date: 'DESC', id: 'DESC' },
    });
    if (userHasPremium(owner)) return rows;
    return rows.filter((row) => !isPesticideActivity(row));
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
    const next = {
      activityType: updateActivityDto.activityType ?? activity.activityType,
      pesticideName: updateActivityDto.pesticideName ?? activity.pesticideName,
    };
    if (isPesticideActivity(activity) || isPesticideActivity(next)) {
      await this.requirePremium(user.id, 'Pesticide logs');
    }

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
    if (updateActivityDto.waterHours !== undefined) {
      const hours = Number(updateActivityDto.waterHours);
      if (isWaterSupplyActivity({ activityType: updateActivityDto.activityType ?? activity.activityType })) {
        if (!Number.isFinite(hours) || hours <= 0) {
          throw new BadRequestException('Enter how many hours of water were supplied.');
        }
      }
      activity.waterHours = Number.isFinite(hours) ? hours : null;
    }

    return this.dailyActivityRepository.save(activity);
  }

  // Delete a daily activity
  async remove(id: number, user: User): Promise<void> {
    const activity = await this.findOne(id, user);
    if (isPesticideActivity(activity)) {
      await this.requirePremium(user.id, 'Pesticide logs');
    }
    await this.dailyActivityRepository.remove(activity);
  }
}
