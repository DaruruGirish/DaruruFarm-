import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Farm } from './farm.entity';
import { CreateFarmDto } from './dto/create-farm.dto';
import { UpdateFarmDto } from './dto/update-farm.dto';
import { User } from '../auth/user.entity';
import { userHasPremium } from '../auth/plan';

@Injectable()
export class FarmService {
  constructor(
    @InjectRepository(Farm)
    private farmRepository: Repository<Farm>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Create a new farm associated with the user
  async create(createFarmDto: CreateFarmDto, user: User): Promise<Farm> {
    const owner = await this.userRepository.findOne({ where: { id: user.id } });
    const count = await this.farmRepository.count({ where: { user: { id: user.id } } });
    if (count >= 1 && !userHasPremium(owner)) {
      throw new ForbiddenException('Free plan includes 1 holding. Upgrade to Premium (₹3,000/year) for unlimited holdings.');
    }
    const farm = this.farmRepository.create({
      ...createFarmDto,
      user,
    });
    return this.farmRepository.save(farm);
  }

  // Find all farms belonging to the user
  async findAll(user: User): Promise<Farm[]> {
    return this.farmRepository.find({
      where: { user: { id: user.id } },
      order: { id: 'DESC' },
    });
  }

  // Find a specific farm belonging to the user
  async findOne(id: number, user: User): Promise<Farm> {
    const farm = await this.farmRepository.findOne({
      where: { id, user: { id: user.id } },
    });
    if (!farm) {
      throw new NotFoundException(`Farm with ID ${id} not found`);
    }
    return farm;
  }

  // Update a farm belonging to the user
  async update(id: number, updateFarmDto: UpdateFarmDto, user: User): Promise<Farm> {
    const farm = await this.findOne(id, user); // checks ownership and existence
    const updatedFarm = this.farmRepository.merge(farm, updateFarmDto);
    return this.farmRepository.save(updatedFarm);
  }

  // Remove a farm belonging to the user
  async remove(id: number, user: User): Promise<void> {
    const farm = await this.findOne(id, user); // checks ownership and existence
    await this.farmRepository.remove(farm);
  }
}
