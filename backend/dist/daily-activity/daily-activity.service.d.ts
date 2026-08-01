import { Repository } from 'typeorm';
import { DailyActivity } from './daily-activity.entity';
import { Farm } from '../farm/farm.entity';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { User } from '../auth/user.entity';
export declare class DailyActivityService {
    private dailyActivityRepository;
    private farmRepository;
    constructor(dailyActivityRepository: Repository<DailyActivity>, farmRepository: Repository<Farm>);
    create(createActivityDto: CreateActivityDto, user: User): Promise<DailyActivity>;
    findAll(user: User): Promise<DailyActivity[]>;
    findOne(id: number, user: User): Promise<DailyActivity>;
    update(id: number, updateActivityDto: UpdateActivityDto, user: User): Promise<DailyActivity>;
    remove(id: number, user: User): Promise<void>;
}
